# 3. 数据流与接口

## 3.1 API 端点

### POST `/api/generate-page`

**请求体**：

```typescript
interface GeneratePageRequest {
  text?: string; // 用户的自然语言描述
  image?: string; // Base64 编码的图片数据（可选）
}
```

**响应体**：

```typescript
// 成功响应 (200)
type GeneratePageResponse = ComponentNode[];

interface ComponentNode {
  id: number; // 递增数字 ID
  name: string; // 组件类型（如 "Button", "Form"）
  desc: string; // 组件描述
  props: Record<string, any>; // 组件属性
  styles: Record<string, any>; // CSS 样式
  parentId: number | null; // 父组件 ID
  children?: ComponentNode[]; // 子组件
}

// 错误响应 (400/500)
interface ErrorResponse {
  message: string;
  reason?: string;
  stack?: string; // 仅 development 环境
}
```

## 3.2 Phase 1: 意图分析

### 输入

```typescript
const messages = [
  new SystemMessage(intentSystemPrompt), // 产品经理角色定义
  new HumanMessage(`请分析以下用户需求：\n\n"${text}"`),
  // 如果有图片
  new HumanMessage({
    content: [
      { type: "text", text: "以下是参考截图：" },
      { type: "image_url", image_url: { url: imageData } },
    ],
  }),
];
```

### 输出 Schema

```typescript
const IntentSchema = z.object({
  description: z
    .string()
    .describe("对用户需求的简要技术摘要，描述页面的核心功能"),

  suggestedComponents: z
    .array(z.string())
    .describe("预测实现该页面所需的组件列表，如 Button, Form, Table 等"),

  layoutType: z.enum([
    "Dashboard", // 仪表盘/数据看板
    "Form", // 表单页面
    "List", // 列表/表格页
    "Detail", // 详情页
    "Landing", // 着陆页/营销页
    "Settings", // 设置页
    "Empty", // 空白页
  ]),
});

type IntentResult = z.infer<typeof IntentSchema>;
```

### 示例输出

```json
{
  "description": "用户登录页面，包含账号密码输入、记住密码选项、登录按钮和注册链接",
  "layoutType": "Form",
  "suggestedComponents": [
    "Form",
    "FormItem",
    "Input",
    "Button",
    "Typography",
    "Container",
    "Space"
  ]
}
```

## 3.3 Phase 2: Schema 生成

### 物料上下文构建

```typescript
function getMaterialContext(suggestedComponents: string[]): string {
  const activeNames = new Set([...CORE_COMPONENTS, ...suggestedComponents]);

  const context = materialsAI
    .filter((m) => activeNames.has(m.name))
    .map((m) => ({
      name: m.name,
      desc: m.desc,
      category: m.category,
      parentTypes: m.parentTypes,
      isContainer: m.isContainer,
      defaultProps: m.defaultProps,
      props: m.props?.slice(0, 5), // 仅保留前5个属性，节省 Token
    }));

  return JSON.stringify(context, null, 2);
}
```

### 输出 Schema

```typescript
const ComponentSchema: z.ZodType<ComponentNodeType> = z
  .object({
    name: ComponentNameEnum,
    props: z.any(),
    styles: z.any(),
  })
  .extend({
    children: z.lazy(() => z.array(ComponentSchema)),
  });

const PageSchema = z.object({
  reasoning: z
    .string()
    .describe("生成布局的思维链：先思考容器结构，再填充组件"),
  root: ComponentSchema.describe("页面根节点，通常 name 为 Page"),
});
```

### 示例输出

```json
{
  "reasoning": "1. 创建 Page 容器作为根节点 2. 添加 Container 用于居中表单区域 3. 添加 Typography 标题 4. 创建 Form，内含 FormItem + Input 5. 添加登录按钮和注册链接",
  "root": {
    "name": "Page",
    "props": {},
    "styles": {},
    "children": [
      {
        "name": "Container",
        "props": {},
        "styles": { "maxWidth": "400px", "margin": "0 auto" },
        "children": [...]
      }
    ]
  }
}
```

## 3.4 Phase 3: Linter 后处理

### 输入输出转换

```typescript
// 输入：LinterNode（AI 生成的原始结构）
interface LinterNode {
  name: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  children: LinterNode[];
}

// 输出：ComponentNode（前端所需格式）
interface ComponentNode extends LinterNode {
  id: number; // 新增：递增 ID
  parentId: number | null; // 新增：父组件 ID
  desc: string; // 新增：描述（使用 name 填充）
}
```

### 修正示例

**修正前（AI 直接输出，违反约束）**：

```json
{
  "name": "Form",
  "children": [{ "name": "Input", "props": { "label": "用户名" } }]
}
```

**修正后（Linter 处理）**：

```json
{
  "name": "Form",
  "children": [
    {
      "name": "FormItem",
      "props": { "label": "用户名" },
      "children": [{ "name": "Input", "props": {} }]
    }
  ]
}
```

## 3.5 完整数据流图

```mermaid
flowchart LR
    subgraph Input
        A[text: string]
        B[image?: base64]
    end

    subgraph Phase1["Phase 1: 意图分析"]
        C[IntentSchema Validation]
        D[IntentResult]
    end

    subgraph Phase2["Phase 2: Schema 生成"]
        E[动态物料筛选]
        F[Prompt 组装]
        G[PageSchema Validation]
        H[PageResult]
    end

    subgraph Phase3["Phase 3: Linter"]
        I[fixComponentTree]
        J[convertToComponentTree]
        K[ComponentNode[]]
    end

    A --> C
    B --> C
    C --> D
    D -->|suggestedComponents| E
    E --> F
    F --> G
    G --> H
    H -->|root| I
    I --> J
    J --> K
```
