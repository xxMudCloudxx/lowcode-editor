# 低代码协同编辑后端架构演进复盘

> 本文档记录了 WebSocket 协同编辑服务端从"Demo 级"到"生产级 Actor 架构"的完整演进历程。

## 目录

- [场景一：并发崩溃与 Map 竞争](#场景一并发崩溃与-map-竞争-the-crash)
- [场景二：乐观锁失效与数据错乱](#场景二乐观锁失效与数据错乱-the-race)
- [场景三：性能瓶颈与全局锁](#场景三性能瓶颈与全局锁-the-bottleneck)
- [场景四：消息堆积与服务雪崩](#场景四消息堆积与服务雪崩-the-backpressure)
- [场景五：僵尸房间与死锁](#场景五僵尸房间与死锁-the-zombie)

---

## 场景一：并发崩溃与 Map 竞争 (The Crash)

### 问题描述

在 Hub 中遍历 `room.Clients` 进行广播时，当高并发发生（有人加入、退出或广播同时进行），服务直接崩溃：

```
fatal error: concurrent map iteration and map write
```

### 错误代码示例

```go
// ❌ 错误做法：在 RLock 下进行写操作
func (h *Hub) handleBroadcast(msg *BroadcastMessage) {
    room.mu.RLock()  // 读锁
    defer room.mu.RUnlock()

    for client := range room.Clients {
        select {
        case client.send <- msg.Message:
        default:
            // ❌ 危险！在读锁保护下执行写操作
            delete(room.Clients, client)  // 写操作！
            close(client.send)
        }
    }
}
```

### 问题根因

1. Go 的 Map 不是并发安全的
2. 在读锁（RLock）保护下意外进行了写操作（delete）
3. 同时有其他 Goroutine 在修改 Map（register/unregister）

### 解决方案：Actor 模型改造

```go
// ✅ 正确做法：clients 私有化，只在 run() 内访问
type Room struct {
    // 私有 clients map - 只在 run() 内访问，无需锁
    clients map[*Client]bool

    // 事件通道：所有操作都变成消息
    broadcast  chan *RoomBroadcast
    register   chan *Client
    unregister chan *Client
}

func (r *Room) run() {
    for {
        select {
        case client := <-r.register:
            r.clients[client] = true  // 单线程，无需锁

        case client := <-r.unregister:
            delete(r.clients, client)  // 单线程，无需锁

        case msg := <-r.broadcast:
            for client := range r.clients {  // 单线程遍历，安全
                // 发送逻辑...
            }
        }
    }
}
```

### 核心原则

> **"不要通过共享内存来通信，而要通过通信来共享内存"**  
> — Go 并发哲学

---

## 场景二：乐观锁失效与数据错乱 (The Race)

### 问题描述：TOCTOU 竞态

多人同时修改文档时，版本检查通过后应用补丁，但两个并发请求都通过了版本检查，导致数据错乱。

### 错误代码示例

```go
// ❌ 错误做法：版本检查在锁外部
func (c *Client) handleOpPatch(message []byte) {
    room := c.Room

    // 时间点 T1：检查版本（无锁）
    if patchPayload.Version != room.Version {
        c.sendError("VERSION_CONFLICT")
        return
    }

    // ⚠️ 时间窗口：其他请求可能在此期间修改版本

    // 时间点 T2：应用补丁（加锁）
    room.mu.Lock()
    room.ApplyPatch(...)  // 基于已过时的版本检查结果
    room.mu.Unlock()
}
```

### 竞态场景复现

```
时间线:
T1: Client A 检查版本 (v=10) ✓
T2: Client B 检查版本 (v=10) ✓
T3: Client A 获取锁，应用补丁，版本 → 11
T4: Client B 获取锁，应用补丁，版本 → 12
    ❌ 但 B 的补丁是基于 v10 计算的，不是 v11！
```

### 解决方案：锁内校验

```go
// ✅ 正确做法：版本检查在锁内部
func (r *Room) ApplyPatch(patchBytes []byte, expectedVersion int64) error {
    r.stateMu.Lock()
    defer r.stateMu.Unlock()

    // 在锁内检查版本，实现 CAS 语义
    if r.Version != expectedVersion {
        return &VersionConflictError{
            CurrentVersion:  r.Version,
            ExpectedVersion: expectedVersion,
        }
    }

    // 应用补丁
    modified, err := patch.Apply(r.CurrentState)
    if err != nil {
        return err
    }

    r.CurrentState = modified
    r.Version++  // 原子递增
    return nil
}
```

### 核心原则

> **"检查"和"操作"必须是原子的，否则就是 TOCTOU 漏洞**

---

## 场景三：性能瓶颈与全局锁 (The Bottleneck)

### 问题描述

所有广播消息（包括高频的光标移动）都发给 Hub 统一分发，Hub 成为系统的全局锁和单点瓶颈。

### 问题场景

```
房间 A: 20人疯狂移动鼠标，每秒 1000 个光标包
房间 B: 2人安静写代码，提交了一个关键补丁

结果：B 的补丁必须排队等 A 的 1000 个光标包处理完
```

### 旧架构：中央集权制

```
[Client A] --msg--> [Hub (Global Lock)] --msg--> [Client B]
                         ^
[Client C] --msg--> [Hub (Global Lock)] --msg--> [Client D]

Hub 忙得要死，单核跑满，其他核围观
```

### 新架构：联邦自治制（YARN 思想）

```
[Client A] --msg--> [Room 1 (Goroutine)] --msg--> [Client B]

[Client C] --msg--> [Room 2 (Goroutine)] --msg--> [Client D]

[Hub] (只负责创建/销毁 Room，完全不碰消息)
```

### 代码实现

```go
// Hub: 极简化，只管房间目录
type Hub struct {
    rooms       map[string]*Room
    mu          sync.RWMutex
    idleRoom    chan *Room  // 只处理空闲信号
    pageService PageService
}

// Client: 直连 Room，绕过 Hub
func (c *Client) handleOpPatch(message []byte) {
    // 直接找 Room 广播，不经过 Hub
    c.Room.Broadcast(message, c, true)
}
```

### 核心原则

> **Hub 是"民政局"，只管登记簿，不管你们内部怎么聊天**

---

## 场景四：消息堆积与服务雪崩 (The Backpressure)

### 问题描述

一个网络卡顿的客户端阻塞了 `client.send` 通道，导致整个 Room 的广播循环被阻塞（Head-of-Line Blocking）。

### 错误代码示例

```go
// ❌ 错误做法：阻塞发送
for client := range r.clients {
    client.send <- msg.Message  // 如果 send 满了，整个循环卡死
}
```

### 解决方案：消息分级 + 背压处理

```go
// ✅ 正确做法：非阻塞发送 + 消息分级
for client := range r.clients {
    select {
    case client.send <- msg.Message:
        // 发送成功
    default:
        // 缓冲区满
        if msg.IsCritical {
            // 关键消息（Patch）阻塞：踢人，触发重连全量同步
            log.Printf("关键消息阻塞，踢出 [%s]", client.UserInfo.UserName)
            delete(r.clients, client)
            close(client.send)
        }
        // 非关键消息（光标）：静默丢弃
    }
}
```

### 消息分级策略

| 消息类型   | 分级      | 阻塞处理           |
| ---------- | --------- | ------------------ |
| Patch/Sync | Critical  | 断开连接，触发重连 |
| 光标移动   | Ephemeral | 静默丢弃           |

### 核心原则

> **Fail Fast 比无限等待更重要。长痛不如短痛，踢掉卡顿用户反而能通过重连恢复一致性**

---

## 场景五：僵尸房间与死锁 (The Zombie)

### 问题描述

房间最后一个人退出，Room 准备销毁。就在这一毫秒，新用户拿到了这个"即将死亡"的 Room 指针，尝试注册。结果：Goroutine 永久阻塞（死锁）。

### 问题场景复现

```
T1: 房间 A 最后一个用户断开
T2: Room.run() 检测到 len(clients) == 0，发送 idle 信号
T3: 新用户 B 调用 Hub.GetOrCreateRoom("A")
    → Hub 发现 Map 里还有 "A"，返回 roomA 指针
T4: Hub.handleIdleRoom 开始执行
    → ClientCount() == 0，调用 room.Stop()
    → Room A 的 run() 循环退出
T5: 用户 B 调用 roomA.Register(client)
    → r.register <- client
    → ❌ 永久阻塞！没人读这个通道了
```

### 解决方案：Hub 协调生死 + 非阻塞注册

**1. Hub 双重检查**

```go
func (h *Hub) handleIdleRoom(room *Room) {
    h.mu.Lock()
    defer h.mu.Unlock()

    // 双重检查：可能在处理期间又有人加入
    if room.ClientCount() > 0 {
        log.Printf("房间 %s 已有新用户，取消销毁", room.ID)
        return
    }

    delete(h.rooms, room.ID)
    room.Stop()  // 通知 Room 停止
}
```

**2. 非阻塞注册**

```go
func (r *Room) Register(client *Client) error {
    select {
    case r.register <- client:
        return nil  // 注册成功
    case <-r.stopChan:
        return ErrRoomClosed  // 房间已关闭
    }
}
```

**3. GetOrCreateRoom 检查 IsStopping**

```go
func (h *Hub) GetOrCreateRoom(roomID string) *Room {
    h.mu.RLock()
    room, exists := h.rooms[roomID]
    h.mu.RUnlock()

    if exists && !room.IsStopping() {
        return room
    }
    // 不存在或正在停止，创建新房间...
}
```

### 核心原则

> **生命周期管理是分布式系统的核心难题。任何"检查-操作"分离的地方都可能有竞态**

---

## 最终架构图

```
                    ┌─────────────────────┐
                    │        Hub          │
                    │  (生死仲裁者)        │
                    │ GetOrCreateRoom     │
                    │ idleRoom → 双重检查  │
                    └──────────┬──────────┘
                               │ 创建/销毁
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Room A      │     │   Room B      │     │   Room C      │
│   run() 循环  │     │   run() 循环  │     │   run() 循环  │
│ ┌───────────┐ │     │ ┌───────────┐ │     │ ┌───────────┐ │
│ │ clients   │ │     │ │ clients   │ │     │ │ clients   │ │
│ │ (私有Map) │ │     │ │ (私有Map) │ │     │ │ (私有Map) │ │
│ │ 无锁访问  │ │     │ │ 无锁访问  │ │     │ │ 无锁访问  │ │
│ └───────────┘ │     │ └───────────┘ │     │ └───────────┘ │
└───────────────┘     └───────────────┘     └───────────────┘
       ▲                     ▲                     ▲
       │                     │                     │
   Clients              Clients              Clients
  (直连Room)           (直连Room)           (直连Room)
```

---

## 技术栈亮点词汇表

| 术语                     | 对应实现                           |
| ------------------------ | ---------------------------------- |
| **Actor Model**          | Room 自治设计，私有状态 + 消息驱动 |
| **Optimistic Locking**   | Version 字段，锁内 CAS 校验        |
| **Backpressure**         | select + default 非阻塞发送        |
| **Cache Locality**       | Client 直连 Room，减少间接跳转     |
| **Double-Check Locking** | Hub 处理空闲房间的逻辑             |
| **Graceful Shutdown**    | stopChan + defer 刷盘              |

---

## 面试话术总结

1. **问并发安全**：Actor 模型 + 无锁设计
2. **问版本冲突**：TOCTOU → 锁内 CAS
3. **问性能扩展**：YARN 思想 + 去中心化路由
4. **问网络抖动**：消息分级 + Fail Fast
5. **问疑难杂症**：僵尸房间 + 生命周期竞态
