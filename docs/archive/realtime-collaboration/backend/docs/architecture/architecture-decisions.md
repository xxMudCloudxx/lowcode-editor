# 架构决策记录 (Architecture Decision Records)

本文档记录了 LowCode Go Server 项目中的关键架构决策及其背后的理由。

---

## ADR-001: 多实例部署方案 — Sticky Sessions

**状态**: ✅ 已采纳  
**日期**: 2024-12-10  
**决策者**: 后端架构 Review

### 背景

WebSocket 协同编辑服务是**有状态的（Stateful）**：每个 Pod 在内存中维护 Room 状态（Schema + Version）。当部署多个 Pod 时，同一页面的用户可能连接到不同 Pod，导致：

1. **协同失效**：用户看不到彼此的操作
2. **数据竞态（Split Brain）**：多 Pod 同时保存，乐观锁冲突

### 方案对比

| 方案                | 优点                 | 缺点                     | 适用场景           |
| ------------------- | -------------------- | ------------------------ | ------------------ |
| **Sticky Sessions** | 零代码改动；延迟最低 | 负载不均；Pod 故障影响大 | MVP/中小规模       |
| **Redis Pub/Sub**   | 真正水平扩展         | 需改代码；时序问题复杂   | 大规模             |
| **专用状态服务**    | 最优架构             | 开发成本最高             | Discord/Slack 级别 |

### 决策

**选择 Sticky Sessions（基于 pageId 的一致性 Hash）**

### 核心理由

> **保证 Single Source of Truth，而非仅仅"省钱"。**

协同编辑的 OT/CRDT 算法极度依赖操作的**时序一致性**。如果用 Redis Pub/Sub：

```
Pod A 收到 op1 (t=100ms)
Pod B 收到 op2 (t=101ms)
    ↓
两个 Pod 同时广播到 Redis
    ↓
Pod A 看到的顺序: op1 → op2
Pod B 看到的顺序: op2 → op1  ← 💥 冲突！
```

要解决这个问题，必须引入**中心定序器（Sequencer）**或**分布式锁**，复杂度指数级上升。

Sticky Sessions 直接绕开了这个问题：

```
同一个 PageID 的所有操作 → 同一个 Pod 处理 → 天然有序
```

### 实现方案

**路由 Key**: `pageId` Query Param（非 IP、非 Cookie）

```nginx
upstream websocket_backend {
    hash $arg_pageId consistent;  # 一致性 Hash
    server pod-a:8080;
    server pod-b:8080;
    server pod-c:8080;
}
```

**K8s Ingress 配置**:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/upstream-hash-by: "$arg_pageId"
```

### 故障恢复

1. 客户端感知断线 → `onclose` 事件
2. 客户端自动重连（指数退避）
3. 一致性 Hash 重新分配到其他 Pod
4. 新 Pod 从数据库加载最新 Schema
5. 数据丢失范围：最多「上次落库到 Pod 挂掉之间」的编辑

### 升级触发条件

| 触发条件                        | 升级方案                   |
| ------------------------------- | -------------------------- |
| 单页面并发 > 50 人              | Redis Pub/Sub + 中心定序器 |
| 需要跨 Pod 实时用户列表         | Redis Pub/Sub              |
| Pod 故障恢复时间 > 10s 不可接受 | 热备 + 状态同步            |

---

## ADR-002: Pre-creation 模式防止幽灵页面

**状态**: ✅ 已采纳  
**日期**: 2024-12-10

### 背景

原实现中，WebSocket 连接不存在的 `pageID` 时会创建"幽灵房间"：

- 内存中存在 Room（Version=1）
- 数据库中不存在记录
- 用户编辑后保存失败（`WHERE page_id = ? AND version = ?` 匹配 0 行）
- **数据蒸发**

### 决策

**选择 Pre-creation 模式**：

1. HTTP `CreatePage` = 创建资源（INSERT）
2. WebSocket = 编辑已存在的资源（UPDATE）
3. `GetOrCreateRoom` 检查数据库，页面不存在返回 `ErrPageNotFound`

### 代码实现

```go
// hub.go
func (h *Hub) GetOrCreateRoom(roomID string) (*Room, error) {
    // ...
    state, version, err := h.pageService.GetPageState(roomID)
    if errors.Is(err, domainErrors.ErrPageNotFound) {
        return nil, ErrPageNotFound  // 拒绝创建房间
    }
    // ...
}
```

### 替代方案（未采纳）

**Upsert on Save**：`UpdateSchema` 处理 `RowsAffected == 0` 时执行 `INSERT`。

**未采纳原因**：

- 破坏乐观锁语义
- 难以区分"记录不存在"和"版本冲突"
- 增加代码复杂度

---

## ADR-003: 只读 GetRoom 解决观察者效应

**状态**: ✅ 已采纳  
**日期**: 2024-12-10

### 背景

原 `PageUseCase.GetPage` 调用 `hub.GetOrCreateRoom`，导致：

- HTTP GET 请求触发 Room 创建
- 大量只读用户产生大量 Goroutine
- 写锁竞争影响吞吐量

### 决策

新增 `GetRoom` 只读方法，`GetPage` 优先使用：

```go
// hub.go
func (h *Hub) GetRoom(roomID string) *Room {
    h.mu.RLock()  // 只用读锁
    defer h.mu.RUnlock()
    // ...
}

// page_usecase.go
func (uc *PageUseCase) GetPage(pageID string) (*entity.Page, error) {
    if room := uc.hub.GetRoom(pageID); room != nil {
        return room.GetSnapshot()  // 内存读取
    }
    return uc.repo.GetByPageID(pageID)  // 数据库读取
}
```

### 效果

- HTTP GET 不再创建 Room
- 读操作只用读锁，吞吐量提升
- 写操作路径不受影响

---

## ADR-004: 统一领域错误定义

**状态**: ✅ 已采纳  
**日期**: 2024-12-10

### 背景

`ErrPageNotFound` 在 `ws` 包和 `repository` 包各定义一份，`errors.Is()` 无法正确匹配。

### 决策

创建 `domain/errors/errors.go` 统一定义业务错误：

```go
package errors

var ErrPageNotFound = errors.New("page not found in database")
var ErrOptimisticLock = errors.New("optimistic lock error")
```

所有包引用同一个错误实例，`errors.Is()` 正确工作。

---

## ADR-005: 强类型 Schema 初始化

**状态**: ✅ 已采纳  
**日期**: 2024-12-10

### 背景

`CreatePage` 使用硬编码 JSON 字符串：

```go
defaultSchema := []byte(`{"rootId":1,"components":{...}}`)  // 💣
```

问题：

- 无类型检查，结构变更时运行时才爆炸
- 难以维护和理解

### 决策

使用强类型结构体 + 工厂方法：

```go
// entity/page.go
type PageSchema struct {
    RootID     int64                `json:"rootId"`
    Components map[string]Component `json:"components"`
}

func NewDefaultSchema() *PageSchema {
    return &PageSchema{
        RootID: 1,
        Components: map[string]Component{
            "1": {ID: 1, Name: "Page", ...},
        },
    }
}

// usecase/page_usecase.go
defaultSchema := entity.NewDefaultSchema()
schemaBytes, _ := defaultSchema.ToBytes()
```

### 效果

- 编译时类型检查
- Schema 结构变更立即报错
- 代码更易维护
