# 6. 物料系统

## 6.1 文件结构

```
server/template/
├── materials-ai.json      # AI 优化的物料元数据
└── component-names.json   # 组件名枚举（校验用）
```

## 6.2 物料元数据格式

```typescript
interface MaterialMeta {
  name: string; // 组件名
  desc: string; // 中文描述
  category: string; // 分类
  parentTypes?: string[]; // 允许的父组件
  isContainer: boolean; // 是否为容器
  defaultProps: Record<string, any>;
  props: PropMeta[];
}
```

## 6.3 组件分类

| 分类     | 组件                                                                      | 数量 |
| -------- | ------------------------------------------------------------------------- | ---- |
| 布局     | Container, Grid, GridColumn, Page, Space                                  | 5    |
| 基础     | Button, Icon, Typography                                                  | 3    |
| 导航     | Breadcrumb, Dropdown, Menu, PageHeader, Pagination, Steps, TabPane, Tabs  | 8    |
| 数据录入 | Form, FormItem, Input, InputNumber, Radio, Select, Slider, Switch, Upload | 9    |
| 数据展示 | Avatar, Card, Image, List, ListItem, Table, TableColumn, Tooltip          | 8    |
| 反馈     | Modal                                                                     | 1    |

**总计**: 34 个组件

## 6.4 组件名校验 (v4)

```typescript
const VALID_COMPONENT_NAMES = new Set(componentNames);

// Phase 1 后过滤无效组件名
intent.suggestedComponents = intent.suggestedComponents.filter((name) =>
  VALID_COMPONENT_NAMES.has(name)
);
```

## 6.5 Core + Recall 策略

### Core 组件集

```typescript
const CORE_COMPONENTS = new Set([
  "Page",
  "Container",
  "Grid",
  "GridColumn",
  "Typography",
  "Button",
  "Icon",
  "Space",
]);
```

### Token 优化

| 策略          | 组件数 | Token   |
| ------------- | ------ | ------- |
| 全量注入      | 34     | ~15,000 |
| Core + Recall | 12-15  | ~5,500  |

## 6.6 设计链配合

设计链输出的 `componentStyles` 会注入到 Phase 3 Prompt：

```json
{
  "componentStyles": {
    "Container": { "maxWidth": "400px", "backgroundColor": "#ffffff" },
    "Button_primary": { "width": "100%", "height": "40px" }
  }
}
```
