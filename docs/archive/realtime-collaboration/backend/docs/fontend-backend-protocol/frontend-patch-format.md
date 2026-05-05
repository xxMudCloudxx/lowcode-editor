# 前端协同编辑 Patch 格式规范

> **用途**: 前端团队参考此文档，提供实际操作产生的 Patch 样本数据

---

## 一、期望的数据格式

后端使用 **RFC 6902 JSON Patch** 格式。每个 Patch 是一个操作数组：

```json
[
  { "op": "replace", "path": "/components/1/props/title", "value": "新标题" },
  { "op": "add", "path": "/components/1/children/-", "value": 5 },
  { "op": "remove", "path": "/components/3" }
]
```

### 支持的操作 (op)

| op        | 描述     | 示例         |
| --------- | -------- | ------------ |
| `add`     | 添加新值 | 添加子组件   |
| `remove`  | 删除值   | 删除组件     |
| `replace` | 替换值   | 修改属性     |
| `move`    | 移动值   | 调整组件顺序 |
| `copy`    | 复制值   | 复制组件     |

### Path 格式

使用 **JSON Pointer (RFC 6901)** 格式：

- `/components/1/props/title` - 组件 1 的 props.title
- `/components/1/children/0` - 组件 1 的第一个子组件
- `/components/1/children/-` - 组件 1 的 children 数组末尾

---

## 二、需要前端提供的样本数据

请在编辑器中执行以下操作，并将 `console.log` 输出的 Patch 复制到下方：

### 测试场景 1: 修改组件名称/描述

**操作**: 选中一个 Button，修改它的 `desc` 字段

**期望的 Patch 格式**:

```json
[{ "op": "replace", "path": "/components/2/desc", "value": "我的按钮" }]
```

**实际输出**:

```json
[
  {
    "op": "replace",
    "path": "/components/1765279327172/desc",
    "value": "按钮aa"
  }
]
```

---

### 测试场景 2: 修改组件样式

**操作**: 选中一个组件，修改它的颜色或尺寸

**期望的 Patch 格式**:

```json
[
  {
    "op": "replace",
    "path": "/components/2/styles/backgroundColor",
    "value": "#ff0000"
  }
]
```

**实际输出**:

```json
[
  {
    "op": "replace",
    "path": "/components/1765279327172/styles",
    "value": {
      "width": "300px"
    }
  }
]

```

---

### 测试场景 3: 修改组件 Props

**操作**: 选中一个 Input，修改它的 `placeholder` 属性

**期望的 Patch 格式**:

```json
[
  {
    "op": "replace",
    "path": "/components/3/props/placeholder",
    "value": "请输入..."
  }
]
```

**实际输出**:

```json
[
  {
    "op": "replace",
    "path": "/components/1765279387185/props",
    "value": {
      "type": "primary",
      "size": "middle",
      "placeholder": "请输入内容...",
      "allowClear": false,
      "disabled": false
    }
  }
]
```

---

### 测试场景 4: 添加新组件

**操作**: 从物料面板拖拽一个新组件到画布

**期望的 Patch 格式**:

```json
[
  { "op": "add", "path": "/components/5", "value": { "id": 5, "name": "Button", ... } },
  { "op": "add", "path": "/components/1/children/-", "value": 5 }
]
```

**实际输出**:

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
      "props": {
        "type": "primary",
        "text": "按钮"
      },
      "parentId": 1,
      "children": []
    }
  }
]
[
  {
    "op": "add",
    "path": "/components/1/children/1",
    "value": 1765279430320
  },
  {
    "op": "add",
    "path": "/components/1765279430320",
    "value": {
      "desc": "栅格-行",
      "id": 1765279430320,
      "name": "Grid",
      "props": {
        "gutter": 1,
        "justify": "start",
        "align": "top",
        "wrap": false
      },
      "parentId": 1,
      "children": []
    }
  }
]
```

---

### 测试场景 5: 删除组件

**操作**: 选中一个组件并删除

**期望的 Patch 格式**:

```json
[
  { "op": "remove", "path": "/components/3" },
  { "op": "remove", "path": "/components/1/children/2" }
]
```

**实际输出**:

```json
[
  {
    "op": "replace",
    "path": "/components/1/children",
    "value": [
      1765279430320
    ]
  },
  {
    "op": "remove",
    "path": "/components/1765279429014"
  }
]

```

---

### 测试场景 6: 移动组件 (调整顺序)

**操作**: 拖拽一个组件到另一个位置

**期望的 Patch 格式**:

```json
[
  {
    "op": "move",
    "from": "/components/1/children/0",
    "path": "/components/1/children/2"
  }
]
```

或者 Immer 可能生成 remove + add：

```json
[
  { "op": "remove", "path": "/components/1/children/0" },
  { "op": "add", "path": "/components/1/children/1", "value": 3 }
]
```

**实际输出**:

```json
//将按钮移到容器中：
[
  {
    "op": "replace",
    "path": "/components/1/children",
    "value": [
      1765279483005
    ]
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
//清空画布：
[
  {
    "op": "replace",
    "path": "/components",
    "value": {
      "1": {
        "id": 1,
        "name": "Page",
        "props": {},
        "desc": "页面",
        "parentId": null,
        "children": []
      }
    }
  }
]
```

### 测试场景7：为组件增加事件:

为按钮增加打开弹窗的组件联动事件：

```
[
  {
    "op": "replace",
    "path": "/components/1765279593601/props",
    "value": {
      "type": "primary",
      "text": "按钮",
      "onClick": {
        "actions": [
          {
            "type": "componentMethod",
            "config": {
              "componentId": 1765279598395,
              "method": "open",
              "args": {}
            }
          }
        ]
      }
    }
  }
]
```



---

## 三、如何获取 Patch 输出

在前端代码中找到 Immer 的 `produceWithPatches` 或 `undoMiddleware`，添加日志：

```typescript
// undoMiddleware.ts 或类似位置
const [nextState, patches, inversePatches] = produceWithPatches(
  state,
  (draft) => {
    // ... 修改逻辑
  }
);

// 添加这行
console.log("Patches:", JSON.stringify(patches, null, 2));
```

---

## 四、数据结构参考

当前前端 Store 结构（供后端理解 path 含义）：

```typescript
interface State {
  components: Record<number, Component>; // 例如 { 1: {...}, 2: {...} }
  rootId: number;
}

interface Component {
  id: number;
  name: string;
  desc: string;
  props: any;
  styles?: CSSProperties;
  parentId?: number | null;
  children?: number[];
}
```

所以 `/components/1/props/title` 表示 `state.components[1].props.title`。

---

## 五、WebSocket 消息格式

前端发送给后端的完整消息结构：

```json
{
  "type": "op-patch",
  "senderId": "user_xxx",
  "payload": {
    "patches": [
      { "op": "replace", "path": "/components/1/desc", "value": "新描述" }
    ],
    "version": 5
  },
  "ts": 1702123456789
}
```

---

## 六、联系人

完成测试后，请将此文档填写完整并发送给后端团队。

- 后端负责人: [填写]
- 前端负责人: [填写]
- 截止日期: [填写]
