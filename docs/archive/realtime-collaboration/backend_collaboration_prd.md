# PRD: 协同编辑后端升级 (Backend Upgrade for Collaboration)

| 文档版本     | V1.0                                           |
| :----------- | :--------------------------------------------- |
| **撰写人**   | Senior Architect                               |
| **状态**     | **已生效 (Active)**                            |
| **参考 PRD** | [collaboration_prd.md](./collaboration_prd.md) |

## 1. 背景与价值 (Background & Value)

### 1.1 背景

为了支持前端升级的协同功能（头像感知、Token 鉴权、三级权限控制），后端需要对 `Room` 管理、WebSocket 协议以及 REST API 进行相应的改造。

### 1.2 核心价值

- **安全性**: 通过 Share Token 和严格的 `Op` 校验，消除未授权访问风险。
- **数据一致性**: 提供 `Graceful Shutdown` 和 `Version Check` 机制，保障数据零丢失。
- **高性能**: 在架构层面优化头像排序与消息广播，支撑高并发协同。

## 2. 数据库设计 (Database Schema)

### 2.1 Pages Table 更新

需要扩展 `pages` 表以支持链接分享和权限控制。

```sql
ALTER TABLE pages
ADD COLUMN share_token VARCHAR(64) UNIQUE,
ADD COLUMN share_permission INT DEFAULT 0, -- 0: Closed, 1: Read, 2: Edit
ADD COLUMN is_collaborating BOOLEAN DEFAULT FALSE; -- 房间开启状态标识

-- 索引用于通过 token 快速查找
CREATE INDEX idx_pages_share_token ON pages(share_token);
```

- `share_token`: 随机生成的字符串 (nano id)，用于 URL 访问。
- `share_permission`: 控制通过 Token 进入的用户的默认权限。

### 2.2 Page_Users Table (可选，未来扩展)

目前主要基于 Token，若需基于账户白名单，需新增关联表：

```sql
CREATE TABLE page_users (
    page_id INT REFERENCES pages(id),
    user_id VARCHAR(64),
    role VARCHAR(20), -- 'editor', 'viewer', 'owner'
    PRIMARY KEY (page_id, user_id)
);
```

## 3. API 接口设计 (REST API)

### 3.1 开启/关闭协同

- `POST /api/pages/:id/start`
  - **Res**: `{ shareToken: "xyz", sharePermission: 2, status: "active" }`
  - **Logic**: 生成 Token，设置 `is_collaborating=true`，初始化 Room (如果不存在)。

- `POST /api/pages/:id/stop`
  - **Res**: `{ schema: {...}, version: 105, status: "closed" }` (返回最终数据!)
  - **Logic**:
    1.  锁定 Room (拒绝新 WS 连接)。
    2.  将内存 Schema 强制刷盘。
    3.  广播 `TypeRoomClosed` 消息踢出所有 Client。
    4.  销毁 Room 实例。
    5.  设置 `is_collaborating=false`。
    6.  返回最新 Schema 供 Owner 同步。

### 3.2 链接管理

- `POST /api/pages/:id/share`
  - **Body**: `{ permission: 1 | 2 | 0 }` (修改链接权限)
  - **Logic**: 更新 DB，并广播 `TypeConfigChange` 给在线用户。若改为 `0/Private`，需剔除所有匿名连接。

- `POST /api/pages/:id/rotate`
  - **Res**: `{ neToken: "new_xyz" }`
  - **Logic**: 生成新 Token，广播 `TypeTokenInvalid` 给旧 Token 用户 (强制断线)。

## 4. WebSocket 协议升级

### 4.1 连接握手 (Handshake)

URL: `wss://.../ws?pageId=p1&token=xyz` & Headers: `Authorization: Bearer <sk>`

**鉴权逻辑**:

1.  **Token 校验**: 检查 `Query.token == DB.share_token`。
2.  **User 校验**: 检查 `Bearer Token` (Clerk)。
3.  **权限裁决**:
    - 如果 User 是 Owner -> Role = Owner。
    - 如果 Token 有效 -> Role = Based on `share_permission` (Viewer/Editor)。
    - 如果 Token 无效且 User 无权 -> **Reject Connection (403)**。

### 4.2 消息类型扩展

- `TypeUserList`: 后端计算 `ActiveTimestamp` 排序，下发 `{ userId, userName, color, role }[]`。
- `TypePermissionChange`: 通知客户端权限变更 `{ target: "uid", role: "viewer" }`。
- **Operation Validation (关键)**:
  - 在 `handleMessage` 循环中：
  - `if msg.Type == "op-patch" && client.Role == "viewer" { StopConnection(Kick) }`

## 5. 边界情况处理 (Edge Cases backend)

### 5.1 房间关闭竞态

- **问题**: Owner 发送 Stop 时，Editor A 发送了一个 Patch。
- **处理**: Room 进入 `Closing` 状态。
  - 对 Editor A 的 Patch: 丢弃或返回 Error (RoomClosed)。
  - 确保落库的 Schema 是 Stop 瞬间的“静止帧”。

### 5.2 权限缓存失效

- **问题**: 数据库中 Token 权限改了，但内存 Room 里的 Client 还在用旧权限。
- **处理**: API 修改权限后，**必须** 通知 Hub/Room 遍历 Client 列表，实时更新内存中的 `client.Role` 字段，并可能需要立刻踢出某些 Client。

## 6. 数据埋点

- **Log Event**: `RoomStart`, `RoomStop`, `TokenRotate`, `SecurityKick (ViewerTriedEdit)`.
