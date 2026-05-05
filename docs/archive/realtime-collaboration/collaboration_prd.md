# PRD: 协同编辑系统升级 (Collaborative Editing System Upgrade) - V3

| 文档版本     | V3.0                              |
| :----------- | :-------------------------------- |
| **撰写人**   | Senior PM                         |
| **状态**     | **修改中 (Implementing Changes)** |
| **最后更新** | 2026-01-08                        |

> **修订记录 (Revision History)**
>
> - **V3**:
>   - **Security Fix**: 强制要求后端对每个 Operation 进行实时权限校验，杜绝 Viewer 脚本攻击。
>   - **Concurrency Fix**: C4 场景升级为 "State Reconciliation" (状态修正)，增加防崩溃校验。
>   - **Performance Fix**: 3.1 头像排序改回前端计算，减轻后端无关负载。
> - **V2**:
>   - 增加 **C3. 启动版本检测** (解决关闭房间时的丢包风险)。
>   - 优化 **3.1 头像排序** 为后端下发。

## 1. 背景与价值 (Background & Value)

### 1.1 背景

当前的低代码编辑器虽然具备基础的 WebSocket 同步能力，但在多人协作场景下缺乏“感知”和“管控”能力。用户无法直观看到谁在与自己一起编辑，也无法对协作者的权限进行精细化管理（如撤销分享、踢人）。这导致了协同体验割裂，存在数据安全隐患。

### 1.2 价值

- **体验升级**: 类似 Google Docs 的实时头像与光标跟随，显著提升协同的“临场感”和效率。
- **安全可控**: 引入 Token 机制和三级撤销体系，彻底解决“链接泄露无法补救”的痛点，满足企业级安全需求。
- **角色分层**: 明确 Owner/Editor/Viewer 身份，支撑从“草稿传阅”到“共同创作”的全生命周期场景。

## 2. 用户故事 (User Stories)

| 角色       | 需求 (I want to...)                       | 价值 (So that...)                                                |
| :--------- | :---------------------------------------- | :--------------------------------------------------------------- |
| **Owner**  | 能看到当前有哪些人正在页面上              | 确认项目组成员是否到位，识别未授权的非法访问者。                 |
| **Owner**  | 能一键重置分享链接 (Rotate Token)         | 当怀疑链接泄露给外部人员时，能立即阻断未授权访问，保障数据安全。 |
| **Owner**  | 能将协同模式彻底关闭 (Stop Collaboration) | 在项目定稿后，收回所有权限，防止后续的意外修改。                 |
| **Editor** | 点击协作者头像能跳转到他的视角            | 快速定位队友正在修改的区域，进行针对性的配合或 Review。          |
| **Viewer** | 能够通过链接实时观看编辑过程但无法操作    | 参与评审会议或进行 Demo 演示，而不用担心误触导致页面损坏。       |

## 3. 功能详细说明 (Functional Requirements)

### 3.1 增强型头像列表 (Avatar Stack)

- **位置**: Top Navigation Bar 右侧，"分享"按钮左侧。
- **显示规则**:
  - **过滤**: 仅显示 **除自己以外** 的在线用户。
  - **折叠**: 最大显示 5 人，超过则显示圆形 `+N` 徽标。
  - **排序 (前端计算)**: 前端根据 `ActiveTimestamp` 对用户列表进行降序排列。
- **交互逻辑**:
  - **Hover**:
    - 高亮该用户在画布内的 **SelectMask** (持续直到移出)。
    - Tooltip 显示完整用户名/匿名ID。
  - **Click**:
    - 触发 `Viewport.scrollTo({ x: user.cursorX, y: user.cursorY })`，带平滑动画。

### 3.2 权限与分享体系 (Permission System)

- **角色权限矩阵**:
  - **Owner (所有者)**: 拥有最高权限 (Kick, Ban, Rotate Token, Close Room)。
  - **Editor (编辑者)**: Can Edit Schema, Can Drag/Drop, Can Change Props.
  - **Viewer (查看者)**: **Read-only**. UI 上禁用所有 Toolbars, Panels, Canvas DND。
- **Security Constraint (高危)**:
  - **服务端操作校验 (Server-side Validation)**: 后端必须校验接收到的每一个 `Patch` 或 `Operation` 消息。
  - **Reject Rule**: 如果 `Client.Role == Viewer` 却发送了修改指令，后端必须 **丢弃指令** 并立即 **断开连接 (Kick)**，记录安全日志。绝不能依赖前端 UI 的禁用状态。

### 3.3 分享菜单与管理 (Advanced Share Menu)

- **入口**: Header "分享" 按钮。
- **状态一: 协同关闭 (OFF)**
  - 显示 "开启协同" 开关。
  - 点击开启 -> 调用后端 `StartRoom` ->生成 Token -> 切换为状态二。
- **状态二: 协同开启 (ON)**
  - **全局开关**: 允许点击关闭。关闭需二次确认 ("这将踢出所有人")。
  - **链接权限**: 下拉选择 `Public Edit` / `Public Read` / `Private (Link Disabled)`。
  - **链接操作**:
    - `Copy Link`: 复制完整 URL。
    - `Rotate Link`: 调用 API 重置 Token，前端提示 "旧链接已失效"。
  - **用户列表**: 列出在线用户，Owner 可点击 `Kick` (踢出单词会话) 或 `Ban` (拉黑)。

### 3.4 独立管理页面 (Dashboard/Shares)

- **路径**: `/dashboard/shares`
- **列表项**:
  - 显示 `PageTitle`, `LastEdited`, `AccessLevel`, `OnlineCount`。
  - 提供 `Close Room` 快捷操作。

## 4. 边界情况 (Edge Cases)

| 场景                                                               | 预期行为 (Expected Behavior)                                                                                                                                                                                                                                                              |
| :----------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1. 降级熔断** <br> 用户正在拖拽组件时，被 Owner 降级为 Viewer。 | 1. 前端收到 `PermissionChanged` 消息。<br>2. **立即执行 `DND.cancel()`**，组件弹回原位。<br>3. 锁定属性面板。<br>4. 弹出 Toast: "您的权限已被更改为只读"。                                                                                                                                |
| **C2. 链接重置** <br> 匿名用户 A 在线编辑时，Owner 重置了链接。    | 1. 后端断开 User A 的 WS 连接，Reason: `TokenInvalid`。<br>2. User A 前端弹窗: "分享链接已失效，请联系所有者获取新链接"。<br>3. User A 无法通过刷新页面重连。                                                                                                                             |
| **C3. 优雅关闭与止损** <br> Response 丢失导致 Owner 本地数据陈旧。 | 1. **Response Handling**: Owner 等待 `StopRoom` 响应覆盖本地。<br>2. **Safety Net**: 下次打开编辑器(Local Mode)时，**并行的 Version Check**。若 `Cloud.Version > Local.Version`，提示 "检测到云端有未同步的协同版本"，强制拉取覆盖本地。                                                  |
| **C4. 状态纠正** <br> 乐观 UI 执行操作但被拒(或并发冲突)。         | 1. WS 收到 `Error: PermissionDenied`。<br>2. **State Reconciliation**: 不单纯执行 Undo。<br>3. **Check Existence**: 如果操作对象已不存在(被删)，则忽略回滚，直接弹窗提示。<br>4. **Sync Trigger**: 建议立即触发一次全量 `SyncRequest`，以服务端状态为准强制刷新本地视图，消除一切不一致。 |

## 5. 数据埋点 (Analytics)

- **Collaboration_Start**: `page_id`, `user_id` (衡量协同渗透率)。
- **Share_Link_Copy**: `permission_level` (衡量用户分享意愿)。
- **Share_Link_Rotate**: `page_id` (衡量链接泄露或安全重置的频率)。
- **Collaborator_Join**: `role` (viewer/editor) (衡量页面热度)。

## 6. UI/UX 描述

### 6.1 此处仅描述 Header 区域变化

```text
[Logo] [Title] ......... [Avatar 1][Avatar 2][+3]  [ Button: Share ▾ ] [Avatar: Me]
                                          |
                                    (Click opens Popover)
+-------------------------------------------------------+
|  协同模式 [ ON (Toggle) ]                             |
|  ---------------------------------------------------  |
|  🌐 任何拥有链接的人可 [ 编辑 ▾ ]                      |
|  http://.../editor/p1?token=xyz   [ 复制 ] [ 重置 ]    |
|  ---------------------------------------------------  |
|  在线用户 (3):                                        |
|  • User A (Editor)  [ Kick ]                          |
|  • Anonymous (Viewer)                                 |
+-------------------------------------------------------+
```

- **Avatar**: 圆形，24x24px，Border 2px solid `userColor`。
- **Share Button**: Primary Color，带 Dropdown Icon。
