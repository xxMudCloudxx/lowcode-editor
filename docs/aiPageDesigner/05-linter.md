# 5. Linter 后处理器

## 5.1 设计哲学

```
"Zod 负责语法，Linter 负责语义"
```

| 层级       | 职责     | 示例                               |
| ---------- | -------- | ---------------------------------- |
| Zod Schema | 语法校验 | JSON 格式正确、`name` 在枚举范围内 |
| Linter     | 语义修正 | Form 的子组件必须是 FormItem       |

### 为什么不把所有规则放在 Zod？

1. **复杂度爆炸**：递归校验 + 父子约束会导致 Schema 过于复杂
2. **Token 成本**：详细的 Schema 描述会显著增加 Token 消耗
3. **灵活性**：Linter 可以实现"尽量修复"而非"直接拒绝"

## 5.2 父子约束规则

### 规则定义

```typescript
interface FixRule {
  expectedChild: string; // 期望的直接子组件类型
  wrapperPropsLift?: string[]; // 需要上浮的属性列表
  wrapperDefaultProps?: Record<string, unknown>; // Wrapper 默认属性
}

const PARENT_CHILD_RULES: Record<string, FixRule> = {
  Form: {
    expectedChild: "FormItem",
    wrapperPropsLift: ["label", "name", "rules", "required", "initialValue"],
    wrapperDefaultProps: {},
  },
  Grid: {
    expectedChild: "GridColumn",
    wrapperPropsLift: ["span", "offset", "order", "pull", "push"],
    wrapperDefaultProps: { span: 12 },
  },
  Table: {
    expectedChild: "TableColumn",
    wrapperPropsLift: ["title", "dataIndex", "key", "width", "fixed"],
    wrapperDefaultProps: { title: "列", dataIndex: "column" },
  },
  List: {
    expectedChild: "ListItem",
    wrapperPropsLift: [],
    wrapperDefaultProps: {},
  },
  Tabs: {
    expectedChild: "TabPane",
    wrapperPropsLift: ["tab", "label"],
    wrapperDefaultProps: { tab: "标签页" },
  },
};
```

### 规则解读

| 父组件 | 必须的直接子组件 | 上浮属性                                   |
| ------ | ---------------- | ------------------------------------------ |
| Form   | FormItem         | label, name, rules, required, initialValue |
| Grid   | GridColumn       | span, offset, order, pull, push            |
| Table  | TableColumn      | title, dataIndex, key, width, fixed        |
| List   | ListItem         | -                                          |
| Tabs   | TabPane          | tab, label                                 |

## 5.3 核心修复逻辑

### 5.3.1 算法流程

```typescript
function fixComponentTree(node: LinterNode): LinterNode {
  // 1. 叶子节点直接返回
  if (!node.children?.length) {
    return { ...node, children: [] };
  }

  // 2. 检查是否有父子约束
  const rule = PARENT_CHILD_RULES[node.name];

  if (rule) {
    // 3. 遍历每个子节点进行修复
    node.children = node.children.map((child) => {
      // 如果已经符合要求，递归处理后返回
      if (child.name === rule.expectedChild) {
        return fixComponentTree(child);
      }

      // 4. 创建 Wrapper 包裹非法子组件
      const wrapper: LinterNode = {
        name: rule.expectedChild,
        props: { ...rule.wrapperDefaultProps },
        styles: {},
        children: [fixComponentTree(child)],
      };

      // 5. 属性上浮
      if (rule.wrapperPropsLift && child.props) {
        for (const propName of rule.wrapperPropsLift) {
          if (child.props[propName] !== undefined) {
            wrapper.props[propName] = child.props[propName];
            delete child.props[propName];
          }
        }
      }

      return wrapper;
    });
  } else {
    // 无特殊约束，直接递归
    node.children = node.children.map((child) => fixComponentTree(child));
  }

  return node;
}
```

### 5.3.2 修复示例

**场景**：AI 生成了 `Form > Input`（违反约束）

```
输入:
Form
└── Input { label: "用户名", name: "username" }

处理过程:
1. 检测到 Form 有规则，expectedChild = "FormItem"
2. Input ≠ FormItem，需要包裹
3. 创建 FormItem Wrapper
4. 上浮 label, name 到 FormItem
5. Input 作为 FormItem 的子节点

输出:
Form
└── FormItem { label: "用户名", name: "username" }
    └── Input {}
```

## 5.4 属性上浮机制 (Prop Lifting)

### 问题背景

AI 可能将本应属于 Wrapper 的属性错误地放在子组件上：

```json
// AI 错误输出
{
  "name": "Grid",
  "children": [
    {
      "name": "Button",
      "props": { "span": 12 } // span 属于 GridColumn，不属于 Button
    }
  ]
}
```

### 解决方案

Linter 自动将属性移动到正确的组件：

```typescript
// 属性上浮逻辑
if (child.props["span"] !== undefined) {
  wrapper.props["span"] = child.props["span"]; // 移动到 GridColumn
  delete child.props["span"]; // 从 Button 删除
}
```

### 修复结果

```json
{
  "name": "Grid",
  "children": [
    {
      "name": "GridColumn",
      "props": { "span": 12 },
      "children": [
        {
          "name": "Button",
          "props": {}
        }
      ]
    }
  ]
}
```

## 5.5 格式转换

### `convertToComponentTree()`

将 LinterNode 转换为前端所需的 ComponentNode 格式：

```typescript
function convertToComponentTree(
  node: LinterNode,
  parentId: number | null = null,
  idCounter = { value: 1 }
): ComponentNode {
  const numericId = idCounter.value++;

  const result = {
    id: numericId,
    name: node.name,
    desc: node.name, // 使用组件名作为描述
    props: node.props || {},
    styles: node.styles || {},
    parentId,
    children: undefined as ComponentNode[] | undefined,
  };

  if (node.children?.length) {
    result.children = node.children.map((child) =>
      convertToComponentTree(child, numericId, idCounter)
    );
  }

  return result;
}
```

### 转换示例

```
输入 (LinterNode):
{
  name: "Page",
  children: [{ name: "Button" }]
}

输出 (ComponentNode):
{
  id: 1,
  name: "Page",
  desc: "Page",
  parentId: null,
  children: [{
    id: 2,
    name: "Button",
    desc: "Button",
    parentId: 1
  }]
}
```

## 5.6 日志输出

Linter 会输出详细的修复日志：

```
[Linter] 修复结构: 将 Input 包裹在 FormItem 中 (父组件: Form)
  └─ 属性上浮: 'label' 从 Input 移动到 FormItem
  └─ 属性上浮: 'name' 从 Input 移动到 FormItem
[Linter] 修复结构: 将 Button 包裹在 GridColumn 中 (父组件: Grid)
  └─ 属性上浮: 'span' 从 Button 移动到 GridColumn
```
