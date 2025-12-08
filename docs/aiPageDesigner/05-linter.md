# 5. Linter 后处理器

## 5.1 设计哲学

```
"Prompt 引导生成，Linter 保底修正"
```

| 层级   | 职责         | 示例                 |
| ------ | ------------ | -------------------- |
| Prompt | 引导正确结构 | 黄金规则约束父子关系 |
| Linter | 保底修正     | 自动包裹违规子组件   |

### 为什么需要 Linter？

即使 Prompt 已经明确约束，LLM 仍可能产生幻觉。Linter 提供最后一道防线，确保输出结构合法。

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
{
  "name": "Grid",
  "children": [
    {
      "name": "Button",
      "props": { "span": 12 }
    }
  ]
}
```

### 解决方案

Linter 自动将属性移动到正确的组件：

```typescript
if (child.props["span"] !== undefined) {
  wrapper.props["span"] = child.props["span"];
  delete child.props["span"];
}
```

## 5.5 页面级样式应用 (v4 新增)

在 Phase 4 中，除了结构修复，还会应用设计链的页面级样式：

```typescript
// 应用页面级别样式
if (design.layoutStrategy?.pageBackground) {
  rootNode.styles.backgroundColor = design.layoutStrategy.pageBackground;
  rootNode.styles.minHeight = "100vh";
}
```

这确保了 Page 组件具有正确的背景色和最小高度。

## 5.6 格式转换

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
    desc: node.name,
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

## 5.7 多格式输入容错 (v4 新增)

由于使用 JsonOutputParser，AI 可能返回不同格式。Linter 增加了容错处理：

```typescript
let rootNode: LinterNode;
if (pageResult.root) {
  rootNode = pageResult.root; // 标准格式: { root: {...} }
} else if (Array.isArray(pageResult)) {
  rootNode = pageResult[0]; // 数组格式: [{...}]
} else {
  rootNode = pageResult; // 直接格式: {...}
}

// 确保基本结构存在
if (!rootNode.props) rootNode.props = {};
if (!rootNode.styles) rootNode.styles = {};
if (!rootNode.children) rootNode.children = [];
```

## 5.8 日志输出

Linter 会输出详细的修复日志：

```
[Linter] 修复结构: 将 Input 包裹在 FormItem 中 (父组件: Form)
  └─ 属性上浮: 'label' 从 Input 移动到 FormItem
  └─ 属性上浮: 'name' 从 Input 移动到 FormItem
```
