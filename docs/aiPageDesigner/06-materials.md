# 6. 物料系统

## 6.1 物料文件结构

```
server/template/
├── materials-ai.json      # AI 优化的物料元数据（完整版）
└── component-names.json   # 组件名枚举（Zod 校验用）
```

## 6.2 物料元数据格式

### `materials-ai.json` 结构

```typescript
interface MaterialMeta {
  name: string; // 组件名（唯一标识）
  desc: string; // 中文描述
  category: string; // 分类：布局、基础、导航、数据录入、数据展示、反馈
  parentTypes?: string[]; // 允许的父组件类型
  isContainer: boolean; // 是否为容器组件
  defaultProps: Record<string, any>; // 默认属性值
  props: PropMeta[]; // 属性定义列表
  events?: EventMeta[]; // 事件定义列表（可选）
  methods?: MethodMeta[]; // 方法定义列表（可选）
}

interface PropMeta {
  name: string | string[]; // 属性名（支持嵌套路径）
  label: string; // 中文标签
  type: string; // 控件类型：input, select, switch, inputNumber 等
  options?: Array<{ label: string; value: any } | string>; // 选项
}
```

### 示例：Button 组件

```json
{
  "name": "Button",
  "desc": "按钮",
  "category": "基础",
  "parentTypes": [
    "Page",
    "Container",
    "Modal",
    "GridColumn",
    "TabPane",
    "Space",
    "Card",
    "Tooltip",
    "ListItem"
  ],
  "isContainer": false,
  "defaultProps": {
    "type": "primary",
    "text": "按钮"
  },
  "props": [
    {
      "name": "type",
      "label": "按钮类型",
      "type": "radio",
      "options": ["primary", "default", "dashed", "text", "link"]
    },
    {
      "name": "size",
      "label": "尺寸",
      "type": "segmented",
      "options": ["small", "middle", "large"]
    },
    { "name": "danger", "label": "危险态", "type": "switch" },
    { "name": "text", "label": "文本", "type": "input" }
  ],
  "events": [
    { "name": "onClick", "label": "点击事件" },
    { "name": "onDoubleClick", "label": "双击事件" }
  ]
}
```

## 6.3 组件分类总览

| 分类     | 组件                                                                      | 数量 |
| -------- | ------------------------------------------------------------------------- | ---- |
| 布局     | Container, Grid, GridColumn, Page, Space                                  | 5    |
| 基础     | Button, Icon, Typography                                                  | 3    |
| 导航     | Breadcrumb, Dropdown, Menu, PageHeader, Pagination, Steps, TabPane, Tabs  | 8    |
| 数据录入 | Form, FormItem, Input, InputNumber, Radio, Select, Slider, Switch, Upload | 9    |
| 数据展示 | Avatar, Card, Image, List, ListItem, Table, TableColumn, Tooltip          | 8    |
| 反馈     | Modal                                                                     | 1    |

**总计**: 34 个组件

## 6.4 `component-names.json`

用于 Zod Schema 动态生成组件名枚举：

```json
[
  "Container",
  "Grid",
  "GridColumn",
  "Page",
  "Space",
  "Button",
  "Icon",
  "Typography",
  "Breadcrumb",
  "Dropdown",
  "Menu",
  "PageHeader",
  "Pagination",
  "Steps",
  "TabPane",
  "Tabs",
  "Form",
  "FormItem",
  "Input",
  "InputNumber",
  "Radio",
  "Select",
  "Slider",
  "Switch",
  "Upload",
  "Avatar",
  "Card",
  "Image",
  "List",
  "ListItem",
  "Table",
  "TableColumn",
  "Tooltip",
  "Modal"
]
```

### 在 Zod 中的使用

```typescript
import componentNames from "./template/component-names.json";

export const ComponentNameEnum = z.enum(
  componentNames as [string, ...string[]]
);

// 校验示例
ComponentNameEnum.parse("Button"); // ✅ 通过
ComponentNameEnum.parse("VideoGrid"); // ❌ 失败：不在枚举中
```

## 6.5 Core + Recall 策略

### 6.5.1 Core 组件集

永远加载的"万金油"组件：

```typescript
const CORE_COMPONENTS = new Set([
  "Page", // 页面根节点
  "Container", // 通用容器
  "Grid", // 栅格布局
  "GridColumn", // 栅格列
  "Typography", // 文本排版
  "Button", // 按钮
  "Icon", // 图标
  "Space", // 间距
]);
```

### 6.5.2 Recall 机制

根据 Phase 1 的 `suggestedComponents` 动态加载额外组件：

```typescript
function getMaterialContext(suggestedComponents: string[] = []): string {
  // 合并 Core + Suggested
  const activeNames = new Set([...CORE_COMPONENTS, ...suggestedComponents]);

  // 过滤并精简物料信息
  const context = materialsAI
    .filter((m) => activeNames.has(m.name))
    .map((m) => ({
      name: m.name,
      desc: m.desc,
      category: m.category,
      parentTypes: m.parentTypes,
      isContainer: m.isContainer,
      defaultProps: m.defaultProps,
      props: m.props?.slice(0, 5), // 只取前5个属性
    }));

  return JSON.stringify(context, null, 2);
}
```

### 6.5.3 Token 优化效果

| 策略                 | 注入组件数 | 预估 Token |
| -------------------- | ---------- | ---------- |
| 全量注入             | 34 个      | ~15,000    |
| Core 仅              | 8 个       | ~3,500     |
| Core + Recall (典型) | 12-15 个   | ~5,500     |

## 6.6 物料元数据用途

| 字段         | Phase 1                       | Phase 2            | Linter   |
| ------------ | ----------------------------- | ------------------ | -------- |
| name         | 用于 suggestedComponents 校验 | 组件名校验         | -        |
| desc         | 帮助理解组件用途              | 帮助选择合适组件   | -        |
| parentTypes  | -                             | 引导正确嵌套       | 间接支持 |
| isContainer  | -                             | 判断是否可有子组件 | -        |
| defaultProps | -                             | 填充默认值         | -        |
| props        | -                             | 了解可配置属性     | -        |

## 6.7 物料生成脚本

物料元数据由 `scripts/export-materials.ts` 从 Ant Design 组件定义自动提取：

```bash
pnpm run export-materials
```

生成流程：

1. 扫描 `src/editor/materials/` 目录
2. 从 `ComponentProtocol` 提取元数据
3. 过滤掉 React 原生属性（通过 `@types/react` 判断）
4. 输出 `materials-ai.json` 和 `component-names.json`
