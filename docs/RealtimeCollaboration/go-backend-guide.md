# 📘 LowCode Backend Architecture Guide (v2.0)

> **最后更新**: 2024-12-11  
> **状态**: 架构稳定，Code Review 通过  
> **参考**: [architecture-decisions.md](./architecture-decisions.md)

---

## 目录

1. [全局架构蓝图](#1-全局架构蓝图-global-architecture-blueprint)
2. [静态架构：分层设计](#2-静态架构分层设计-layered-design)
3. [动态架构：协同引擎](#3-动态架构协同引擎-collaboration-engine)
4. [扩展性架构：集群部署](#4-扩展性架构集群部署-scaling-strategy)
5. [工程规范与构建](#5-工程规范与构建-engineering--build)
6. [开发阶段规划](#6-开发阶段规划-development-phases)

---

## 1. 全局架构蓝图 (Global Architecture Blueprint)

本系统不仅仅是一个简单的 CRUD 后端，而是一个**混合态（Hybrid State）系统**。它同时具备：

- **无状态（Stateless）** 的 REST API 能力
- **有状态（Stateful）** 的实时协同能力

### 1.1 系统层级鸟瞰图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         负载均衡 (Nginx / K8s Ingress)                │
│                    hash $arg_pageId consistent                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│     HTTP 流量 (REST)     │   │   WebSocket 流量 (WS)    │
│       无状态服务          │   │      有状态服务           │
└─────────────────────────┘   └─────────────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│      Gin Router         │   │      Hub (Actor)        │
│      Controller         │   │      Room (State)       │
│      UseCase            │   │      Client (Conn)      │
│      Repository         │   │                         │
└─────────────────────────┘   └─────────────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │   PostgreSQL (JSONB)        │
              │   Clerk (Auth)              │
              └─────────────────────────────┘
```

**流量分流规则：**

| 协议          | 用途                 | 架构模式           | 状态管理        |
| ------------- | -------------------- | ------------------ | --------------- |
| **HTTP**      | 页面管理、预览、鉴权 | Clean Architecture | 数据库          |
| **WebSocket** | 协同编辑、光标同步   | Actor Model        | 内存 (Hub/Room) |

### 1.2 核心设计哲学

#### 双数据源仲裁 (Dual Source of Truth)

```
┌────────────────────────────────────────────────────────┐
│                     GetPage 读取逻辑                    │
├────────────────────────────────────────────────────────┤
│  1. 先问 Hub (内存) → Room 存在？                       │
│     ├── 是 → 返回内存快照 (热数据，最新)                 │
│     └── 否 → 继续下一步                                 │
│  2. 读数据库 (冷数据，已持久化)                          │
└────────────────────────────────────────────────────────┘
```

| 数据类型   | 存储位置        | 权威性       | 场景             |
| ---------- | --------------- | ------------ | ---------------- |
| **热数据** | 内存 (Hub/Room) | 协同的权威   | 正在被编辑的页面 |
| **冷数据** | PostgreSQL      | 持久化的权威 | 无人编辑的页面   |

#### 洋葱架构 (Onion Architecture)

```
          ┌─────────────────────────────────────┐
          │          Drivers (外部)              │
          │  Gin, WebSocket, PostgreSQL, Clerk  │
          ├─────────────────────────────────────┤
          │     Interface Adapters (适配器)      │
          │   Controller, Repository 实现       │
          ├─────────────────────────────────────┤
          │        Use Cases (业务逻辑)          │
          │         PageUseCase                 │
          ├─────────────────────────────────────┤
          │      Domain (核心领域)               │
          │  Entity, Repository 接口, Errors    │
          └─────────────────────────────────────┘
                         ↑
               依赖方向：外 → 内
```

**关键规则**：

- `domain/` 不依赖任何外部框架（Gin, GORM）
- 外部依赖通过接口注入 (Dependency Injection)
- 业务逻辑与基础设施解耦

#### 零信任输入 (Zero Trust Input)

> **ADR-002**: WebSocket 连接建立前必须经过严格的数据库存在性校验，杜绝"幽灵页面"。

```go
// 错误做法 ❌
state = []byte(`{"rootId":1,"components":{}}`)  // 伪造默认值

// 正确做法 ✅
if page == nil {
    return nil, 0, domainErrors.ErrPageNotFound  // 拒绝连接
}
```

---

## 2. 静态架构：分层设计 (Layered Design)

采用严格的**单向依赖原则**：`Drivers → Interface Adapters → Use Cases → Domain`

### 2.1 项目目录结构

```
lowercode-go-server/
├── cmd/
│   └── main.go                     # 应用入口 + 优雅停机
├── api/                            # API 层 (接收请求)
│   ├── controller/
│   │   ├── page_controller.go      # HTTP 页面接口
│   │   ├── ws_handler.go           # WebSocket 升级处理
│   │   └── webhook_controller.go   # Clerk Webhook
│   ├── route/
│   │   └── route.go                # 路由配置
│   └── middleware/
│       └── clerk_auth.go           # Clerk JWT 双模式鉴权
├── bootstrap/                      # 启动配置 (依赖注入)
│   ├── database.go                 # PostgreSQL 连接
│   └── env.go                      # 环境变量
├── domain/                         # 领域层 (核心定义) ⭐
│   ├── entity/
│   │   ├── page.go                 # Page 实体 + PageSchema + NewDefaultSchema
│   │   └── user.go                 # User 实体 (Clerk 同步)
│   ├── repository/
│   │   └── page_repository.go      # Repository 接口
│   └── errors/
│       └── errors.go               # 统一领域错误定义
├── usecase/                        # 用例层 (业务逻辑)
│   └── page_usecase.go             # 注入 Hub，解决数据双源
├── repository/                     # Repository 实现
│   └── page_repository.go          # GORM 实现 + 乐观锁
└── internal/ws/                    # WebSocket 服务 (Actor Model)
    ├── hub.go                      # 房间管理 (生死仲裁者)
    ├── room.go                     # 状态管理 + 定时刷盘
    ├── client.go                   # 客户端连接 + 心跳
    └── message.go                  # 消息协议 + 错误码
```

### 2.2 Domain Layer (核心域)

**职责**: 定义数据结构 (Entity) 和行为接口 (Repository Interface)

**关键文件**:

| 文件                                   | 职责                                                |
| -------------------------------------- | --------------------------------------------------- |
| `domain/entity/page.go`                | `PageSchema` 结构体 + `NewDefaultSchema()` 工厂方法 |
| `domain/repository/page_repository.go` | 数据访问接口定义                                    |
| `domain/errors/errors.go`              | 统一的业务错误定义                                  |

**规则**: 纯 Go 代码，无 `github.com/gin-gonic/gin` 或数据库驱动

```go
// domain/entity/page.go - 强类型 Schema 定义

type PageSchema struct {
    RootID     int64                `json:"rootId"`
    Components map[string]Component `json:"components"`
}

func NewDefaultSchema() *PageSchema {
    return &PageSchema{
        RootID: 1,
        Components: map[string]Component{
            "1": {ID: 1, Name: "Page", Desc: "页面根节点"},
        },
    }
}
```

```go
// domain/errors/errors.go - 统一错误定义

var ErrPageNotFound = errors.New("page not found in database")
var ErrOptimisticLock = errors.New("optimistic lock error")
```

### 2.3 UseCase Layer (业务逻辑层)

**职责**: 编排业务流程，连接 HTTP 和 WebSocket 世界的桥梁

**关键文件**: `usecase/page_usecase.go`

**核心逻辑**:

```go
// GetPage: 智能路由读取（解决观察者效应 ADR-003）
func (uc *PageUseCase) GetPage(pageID string) (*entity.Page, error) {
    // ⚠️ 使用 GetRoom 而非 GetOrCreateRoom，避免 HTTP GET 触发房间创建
    if room := uc.hub.GetRoom(pageID); room != nil {
        snapshot, version := room.GetSnapshot()
        return &entity.Page{Schema: snapshot, Version: version}, nil
    }
    return uc.repo.GetByPageID(pageID)
}

// CreatePage: 使用强类型初始化（避免硬编码 JSON ADR-005）
func (uc *PageUseCase) CreatePage(pageID, creatorID string) (*entity.Page, error) {
    defaultSchema := entity.NewDefaultSchema()
    schemaBytes, _ := defaultSchema.ToBytes()
    // ...
}
```

### 2.4 Interface Layer (接口适配层)

| 子层                                | 职责                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| **Repositories** (`repository/`)    | 实现 domain 定义的接口，处理 SQL 细节、乐观锁、JSONB 序列化 |
| **Controllers** (`api/controller/`) | 解析 HTTP 请求，验证参数，调用 UseCase                      |

```go
// repository/page_repository.go - 乐观锁实现

func (r *pageRepository) UpdateSchema(pageID string, schema []byte, oldVersion int64) error {
    result := r.db.Model(&entity.Page{}).
        Where("page_id = ? AND version = ?", pageID, oldVersion).
        Updates(map[string]interface{}{
            "schema":  string(schema),
            "version": oldVersion + 1,
        })

    if result.RowsAffected == 0 {
        return domainErrors.ErrOptimisticLock
    }
    return nil
}
```

### 2.5 Infrastructure Layer (基础设施层)

| 组件             | 技术选型                     |
| ---------------- | ---------------------------- |
| Web Framework    | Gin                          |
| Database         | PostgreSQL + GORM            |
| WebSocket Engine | Gorilla WebSocket + 自研 Hub |
| Authentication   | Clerk JWT + Webhook          |

---

## 3. 动态架构：协同引擎 (Collaboration Engine)

这是系统的"心脏"，处理高并发的实时编辑。

### 3.1 Actor 模型 (Hub & Rooms)

不使用传统的锁机制来管理状态，而是采用**类 Actor 模型**：

```
┌─────────────────────────────────────────────────────────────┐
│                           Hub                                │
│                     (生死仲裁者, 全局单例)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  rooms map[string]*Room                              │    │
│  │  idleRoom chan *Room  ← Room 空闲时发送销毁请求       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  职责：                                                       │
│  • GetRoom(): 只读获取，不创建（解决观察者效应）               │
│  • GetOrCreateRoom(): 创建房间（验证 DB 存在性）              │
│  • handleIdleRoom(): 双重检查后销毁房间                       │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ 管理多个
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                          Room                                │
│                    (执行者, 每页面一个)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CurrentState []byte   ← 内存中的最新 Schema          │    │
│  │  Version      int64    ← 乐观锁版本号                  │    │
│  │  clients      map[*Client]bool                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  职责：                                                       │
│  • ApplyPatch(): 应用 JSON Patch + Version++                │
│  • Broadcast(): 广播给房间内所有 Client                       │
│  • 定时/阈值刷盘到数据库                                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 数据流转 (Data Flow)

**场景：用户 A 编辑页面**

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Inbound                                                        │
│    Client 发送 op-patch 消息                                       │
│    {"type":"op-patch","payload":{"patches":[...],"version":10}}   │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. Processing                                                     │
│    消息进入 ws.Client 的 ReadPump                                  │
│    ├── 版本检查: payload.version == room.Version?                  │
│    ├── 应用 Patch: room.ApplyPatch(patches)                       │
│    └── Version++                                                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Outbound                                                       │
│    Room 将 Patch 广播给房间内所有 Client 的 send channel            │
│    (阻塞时断开连接，保证消息不丢失)                                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Persistence (Async)                                            │
│    Room 定期 (30s) 或达到阈值 (50 Patch) 时调用                     │
│    Repository.UpdateSchema 落库                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 消息协议

```go
// internal/ws/message.go

const (
    TypeOpPatch    MessageType = "op-patch"     // 增量编辑补丁 (关键)
    TypeCursorMove MessageType = "cursor-move"  // 光标位置 (非关键)
    TypeUserJoin   MessageType = "user-join"    // 用户加入
    TypeUserLeave  MessageType = "user-leave"   // 用户离开
    TypeSync       MessageType = "sync"         // 全量同步
    TypeError      MessageType = "error"        // 错误消息
)

// 错误码定义
const (
    ErrVersionConflict ErrorCode = "VERSION_CONFLICT"
    ErrPatchFailed     ErrorCode = "PATCH_FAILED"
    ErrPageNotFound    ErrorCode = "PAGE_NOT_FOUND"
    ErrInternalError   ErrorCode = "INTERNAL_ERROR"
)
```

### 3.4 关键安全机制

| 问题           | 解决方案 (ADR)                                           |
| -------------- | -------------------------------------------------------- |
| 幽灵页面       | `GetOrCreateRoom` 验证 DB 存在性，不存在则拒绝 (ADR-002) |
| 观察者效应     | `GetPage` 使用只读 `GetRoom`，不创建房间 (ADR-003)       |
| 数据竞态       | 乐观锁 (version 检查) + 单 Room 串行处理                 |
| Goroutine 泄漏 | `Room.Stop()` 阻塞等待 `flushToDB` 完成                  |

---

## 4. 扩展性架构：集群部署 (Scaling Strategy)

> **ADR-001**: 为了从单机迈向集群（Kubernetes），我们采用 **Sticky Sessions** 策略。

### 4.1 问题背景

WebSocket 是有状态的长连接。如果用户 A 连到 Pod 1，用户 B 连到 Pod 2，他们将无法协同（脑裂）。

```
用户 A ──► Pod 1 (Room 1, v10)
                                  ← 互相看不见！
用户 B ──► Pod 2 (Room 1, v10)
```

### 4.2 解决方案：一致性哈希 (Consistent Hashing)

**核心原理**：同一 `pageId` 的所有连接始终路由到同一个 Pod

```
WebSocket URL: wss://api.example.com/ws?pageId=abc123
                                        ↑
                              hash("abc123") % N → Pod X
```

**Nginx 配置**:

```nginx
upstream websocket_backend {
    hash $arg_pageId consistent;  # 基于 pageId 一致性 Hash
    server pod-a:8080;
    server pod-b:8080;
    server pod-c:8080;
}

location /ws {
    proxy_pass http://websocket_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**K8s Ingress 配置**:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/upstream-hash-by: "$arg_pageId"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: lowcode-backend
                port:
                  number: 8080
```

### 4.3 为什么不用 Redis Pub/Sub？

> **关键洞察**：Sticky Sessions 保证了 **Single Source of Truth**，这是协同编辑的核心要求。

```
Redis Pub/Sub 的问题：

Pod A 收到 op1 (t=100ms)
Pod B 收到 op2 (t=101ms)
    ↓
两个 Pod 同时广播到 Redis
    ↓
Pod A 看到: op1 → op2
Pod B 看到: op2 → op1  ← 💥 时序冲突！
```

要解决这个问题，必须引入**中心定序器**或**分布式锁**，复杂度指数级上升。

Sticky Sessions 直接绕开了这个问题：

```
同一个 PageID 的所有操作 → 同一个 Pod 处理 → 天然有序
```

### 4.4 故障恢复

| 阶段              | 处理                                  |
| ----------------- | ------------------------------------- |
| 1. 客户端感知断线 | WebSocket `onclose` 事件              |
| 2. 客户端自动重连 | 指数退避 (1s → 2s → 4s → 8s...)       |
| 3. 重新路由       | 一致性 Hash 分配到其他 Pod            |
| 4. 房间重建       | 新 Pod 从数据库加载最新 Schema        |
| 5. 数据丢失范围   | 最多「上次落库到 Pod 挂掉之间」的编辑 |

### 4.5 升级触发条件

| 条件                    | 升级方案                   |
| ----------------------- | -------------------------- |
| 单页面并发 > 50 人      | Redis Pub/Sub + 中心定序器 |
| 需要跨 Pod 实时用户列表 | Redis Pub/Sub              |
| Pod 故障恢复 < 5s       | 热备 + 状态同步            |

---

## 5. 工程规范与构建 (Engineering & Build)

### 5.1 数据库设计

**Schema**: 使用 PostgreSQL JSONB 存储页面结构

```sql
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    page_id VARCHAR(64) UNIQUE NOT NULL,
    schema JSONB NOT NULL,
    version BIGINT DEFAULT 1,
    creator_id VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pages_creator ON pages(creator_id);
```

**乐观锁**: 所有更新操作必须带上 version 条件

```go
WHERE page_id = ? AND version = ?
```

### 5.2 依赖安装

```bash
# 初始化
go mod init lowercode-go-server

# 核心依赖
go get github.com/gin-gonic/gin
go get github.com/gorilla/websocket
go get github.com/evanphx/json-patch/v5
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get gorm.io/datatypes
go get github.com/clerk/clerk-sdk-go/v2
go get github.com/joho/godotenv
```

### 5.3 环境变量 (.env)

```env
# 数据库
DATABASE_URL=postgres://user:password@localhost:5432/lowercode?sslmode=disable

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxx

# 服务器
PORT=8080
```

### 5.4 构建流水线

**Local Dev**:

```bash
# 启动数据库
docker-compose up -d postgres

# 运行服务
go run cmd/main.go
```

**Production**:

```dockerfile
# Multi-stage Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server cmd/main.go

FROM alpine:3.18
COPY --from=builder /app/server /server
CMD ["/server"]
```

**K8s Deployment**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lowcode-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          image: lowcode-backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
```

---

## 6. 开发阶段规划 (Development Phases)

### Phase 1: 基础设施 ✅

| 任务                                    | 状态    |
| --------------------------------------- | ------- |
| 项目初始化 + Clean Architecture 目录    | ✅ 完成 |
| PostgreSQL 连接 + GORM 配置             | ✅ 完成 |
| Domain 层定义 (Entity, Repository 接口) | ✅ 完成 |
| 统一领域错误定义                        | ✅ 完成 |

### Phase 2: WebSocket 协同引擎 ✅

| 任务                     | 状态    |
| ------------------------ | ------- |
| Hub + Room + Client 实现 | ✅ 完成 |
| JSON Patch 应用逻辑      | ✅ 完成 |
| 定时/阈值刷盘机制        | ✅ 完成 |
| 幽灵页面防护 (ADR-002)   | ✅ 完成 |
| 观察者效应修复 (ADR-003) | ✅ 完成 |
| Actor Model 重构         | ✅ 完成 |

### Phase 3: API 层 🔄

| 任务                   | 状态      |
| ---------------------- | --------- |
| Clerk JWT 鉴权中间件   | ✅ 完成   |
| REST API (CRUD)        | 🔄 进行中 |
| WebSocket Handler      | 🔄 进行中 |
| Clerk Webhook 用户同步 | ⏳ 待开始 |

### Phase 4: 前后端联调 ⏳

| 任务                    | 状态      |
| ----------------------- | --------- |
| 前端 WebSocket SDK 适配 | ⏳ 待开始 |
| 协同编辑集成测试        | ⏳ 待开始 |
| 错误处理与重连逻辑      | ⏳ 待开始 |

### Phase 5: 部署上线 ⏳

| 任务                                    | 状态      |
| --------------------------------------- | --------- |
| Dockerfile 编写                         | ⏳ 待开始 |
| K8s 配置 (Deployment, Service, Ingress) | ⏳ 待开始 |
| Sticky Sessions 配置                    | ⏳ 待开始 |
| 监控与日志                              | ⏳ 待开始 |

---

## 附录：相关文档

- [architecture-decisions.md](./architecture-decisions.md) - 架构决策记录 (ADR)
- [websocket-architecture-retrospective.md](./websocket-architecture-retrospective.md) - WebSocket 架构回顾
- [development-phases.md](./development-phases.md) - 详细开发计划
