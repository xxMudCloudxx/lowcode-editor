# WebSocket 消息协议规范

本文档定义了前后端 WebSocket 通信的消息格式。

## 通用消息结构

所有 WebSocket 消息都遵循以下结构：

```json
{
  "type": "消息类型",
  "senderId": "发送者ID",
  "payload": { ... },
  "ts": 1702234567890
}
```

| 字段       | 类型   | 说明                                   |
| ---------- | ------ | -------------------------------------- |
| `type`     | string | 消息类型，见下表                       |
| `senderId` | string | 发送者用户 ID，服务端消息为 `"server"` |
| `payload`  | object | 消息内容，结构取决于 type              |
| `ts`       | number | 时间戳（毫秒）                         |

---

## 消息类型

| Type          | 方向                   | 说明                   |
| ------------- | ---------------------- | ---------------------- |
| `op-patch`    | 前端 → 后端 → 其他前端 | 增量编辑补丁           |
| `cursor-move` | 前端 → 后端 → 其他前端 | 光标位置同步           |
| `sync`        | 后端 → 前端            | 全量同步（新用户加入） |
| `user-join`   | 后端 → 前端            | 用户加入通知           |
| `user-leave`  | 后端 → 前端            | 用户离开通知           |
| `error`       | 后端 → 前端            | 错误消息               |

---

## op-patch（增量编辑补丁）

**方向**：前端 → 后端 → 广播给其他前端

### 前端发送格式

```json
{
  "type": "op-patch",
  "senderId": "user_123",
  "payload": {
    "patches": [
      { "op": "replace", "path": "/components/1/props/text", "value": "Hello" },
      {
        "op": "add",
        "path": "/components/2",
        "value": { "id": 2, "name": "Button" }
      }
    ],
    "version": 10
  },
  "ts": 1702234567890
}
```

### payload 结构

| 字段      | 类型   | 必填 | 说明                       |
| --------- | ------ | ---- | -------------------------- |
| `patches` | array  | ✅   | RFC 6902 JSON Patch 数组   |
| `version` | number | ✅   | 客户端当前版本号（乐观锁） |

### patches 格式（RFC 6902）

> **注意**：前端使用 Immer 生成 patches，组件 ID 是时间戳数字，且通常是整体替换而非细粒度修改。

**修改组件描述**：

```json
[
  {
    "op": "replace",
    "path": "/components/1765279327172/desc",
    "value": "按钮aa"
  }
]
```

**修改组件样式**（整体替换 styles 对象）：

```json
[
  {
    "op": "replace",
    "path": "/components/1765279327172/styles",
    "value": { "width": "300px" }
  }
]
```

**添加新组件**（先加 children 引用，再加组件本体）：

```json
[
  {
    "op": "add",
    "path": "/components/1/children/0",
    "value": 1765279429014
  },
  {
    "op": "add",
    "path": "/components/1765279429014",
    "value": {
      "desc": "按钮",
      "id": 1765279429014,
      "name": "Button",
      "props": { "type": "primary", "text": "按钮" },
      "parentId": 1,
      "children": []
    }
  }
]
```

**删除组件**：

```json
[
  {
    "op": "replace",
    "path": "/components/1/children",
    "value": [1765279430320]
  },
  {
    "op": "remove",
    "path": "/components/1765279429014"
  }
]
```

**移动组件**（没有用 `move`，而是 replace + add）：

```json
[
  {
    "op": "replace",
    "path": "/components/1/children",
    "value": [1765279483005]
  },
  {
    "op": "add",
    "path": "/components/1765279483005/children/0",
    "value": 1765279483847
  },
  {
    "op": "replace",
    "path": "/components/1765279483847/parentId",
    "value": 1765279483005
  }
]
```

### 后端处理逻辑

```
1. 检查 version 是否等于服务端当前版本
2. 如果相等：应用 patches，版本 +1，广播给其他人
3. 如果不相等：返回 VERSION_CONFLICT 错误
```

---

## sync（全量同步）

**方向**：后端 → 前端（新用户加入时）

```json
{
  "type": "sync",
  "senderId": "server",
  "payload": {
    "schema": {
      "rootId": 1,
      "components": {
        "1": { "id": 1, "name": "Page", "props": {}, "parentId": null }
      }
    },
    "version": 15,
    "users": [{ "userId": "user_456", "userName": "Alice", "color": "#FF5733" }]
  },
  "ts": 1702234567890
}
```

### payload 结构

| 字段      | 类型   | 说明               |
| --------- | ------ | ------------------ |
| `schema`  | object | 完整的页面状态     |
| `version` | number | 当前服务端版本号   |
| `users`   | array  | 房间内其他用户列表 |

---

## cursor-move（光标位置）

**方向**：前端 → 后端 → 广播给其他前端

```json
{
  "type": "cursor-move",
  "senderId": "user_123",
  "payload": {
    "componentId": "comp_456",
    "position": { "x": 100, "y": 200 }
  },
  "ts": 1702234567890
}
```

> **注意**：光标消息是非关键消息，后端不做持久化，网络拥堵时可能丢弃。

---

## error（错误消息）

**方向**：后端 → 前端

```json
{
  "type": "error",
  "senderId": "server",
  "payload": {
    "code": "VERSION_CONFLICT",
    "message": "current: 15, expected: 10"
  },
  "ts": 1702234567890
}
```

### 错误码列表

| Code               | 说明           | 前端处理建议           |
| ------------------ | -------------- | ---------------------- |
| `VERSION_CONFLICT` | 版本冲突       | 拉取最新状态后重新提交 |
| `PATCH_INVALID`    | Patch 格式错误 | 检查 patches 数组格式  |
| `PATCH_FAILED`     | Patch 应用失败 | 可能路径不存在         |
| `ROOM_NOT_FOUND`   | 房间不存在     | 刷新页面重新加入       |
| `UNAUTHORIZED`     | 未授权         | 重新登录               |
| `INTERNAL_ERROR`   | 服务器错误     | 稍后重试               |

---

## 版本冲突处理流程

```
前端 A                    后端                     前端 B
   │                       │                         │
   │ op-patch (v=10)       │                         │
   ├──────────────────────►│                         │
   │                       │ 检查 v==10 ✓            │
   │                       │ 应用 patch, v→11        │
   │                       │ op-patch (v=11)         │
   │                       ├────────────────────────►│
   │                       │                         │
   │                       │◄────────────────────────┤
   │                       │ op-patch (v=10) ❌      │
   │                       │                         │
   │◄──────────────────────┤                         │
   │ error: VERSION_CONFLICT                         │
   │ (current:11, expected:10)                       │
   │                       │                         │
   │ 拉取 sync             │                         │
   ├──────────────────────►│                         │
   │◄──────────────────────┤                         │
   │ sync (v=11, schema)   │                         │
   │                       │                         │
   │ 重新计算 patch        │                         │
   │ op-patch (v=11)       │                         │
   ├──────────────────────►│                         │
```

---

## 前端实现建议

```typescript
// 发送 patch
function sendPatch(patches: Operation[]) {
  const message: WSMessage = {
    type: "op-patch",
    senderId: currentUser.id,
    payload: {
      patches,
      version: currentVersion, // 必须携带当前版本
    },
    ts: Date.now(),
  };
  ws.send(JSON.stringify(message));
}

// 处理错误
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "error") {
    switch (msg.payload.code) {
      case "VERSION_CONFLICT":
        // 请求全量同步后重试
        requestSync();
        break;
      // ...
    }
  }
};
```
