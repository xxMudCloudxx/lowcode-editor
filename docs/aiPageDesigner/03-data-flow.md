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
  styles: Record<string, any>; // CSS 样式（含设计链样式）
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
  new SystemMessage(intentSystemPrompt),
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

### 输出

```typescript
interface IntentResult {
  description: string; // 页面功能技术摘要
  layoutType: string; // Dashboard | Form | List | Detail | Landing | Settings | Empty
  suggestedComponents: string[]; // 预测所需组件列表
}
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
    "Container"
  ]
}
```

## 3.3 Phase 2: 设计链 (新增!)

### 输入

```typescript
const designMessages = [
  new SystemMessage(designSystemPrompt),
  new HumanMessage(
    `页面需求：${intent.description}\n\n` +
      `页面类型：${intent.layoutType}\n\n` +
      `请输出视觉设计方案 JSON。`
  ),
];
```

### 输出

```typescript
interface DesignResult {
  layoutStrategy: {
    type: string; // centered-card | full-width | sidebar | two-column
    containerMaxWidth?: string; // 如 "400px"
    containerPadding?: string; // 如 "40px"
    containerBackground?: string; // 如 "#ffffff"
    containerBorderRadius?: string; // 如 "8px"
    containerShadow?: string; // 如 "0 2px 8px rgba(0,0,0,0.08)"
    pageBackground?: string; // 如 "#f5f5f5"
  };
  colorScheme: {
    primary: string; // 主色
    background: string; // 页面背景
    surface: string; // 卡片/容器背景
    text: string; // 主文字色
    textSecondary: string; // 次要文字色
    border: string; // 边框色
  };
  typography: Record<string, any>; // 排版规范
  spacing: Record<string, string>; // 间距规范
  componentStyles: Record<string, Record<string, string>>; // 组件样式预设
}
```

### 示例输出

```json
{
  "layoutStrategy": {
    "type": "centered-card",
    "containerMaxWidth": "400px",
    "containerPadding": "40px",
    "pageBackground": "#f5f5f5"
  },
  "colorScheme": {
    "primary": "#1677ff",
    "background": "#f5f5f5",
    "surface": "#ffffff",
    "text": "#1f1f1f"
  },
  "componentStyles": {
    "Container": {
      "maxWidth": "400px",
      "margin": "40px auto",
      "backgroundColor": "#ffffff",
      "borderRadius": "8px"
    },
    "Button_primary": {
      "width": "100%",
      "height": "40px"
    }
  }
}
```

## 3.4 Phase 3: Schema 生成

### 设计规范注入

设计链的输出会被格式化后注入到 Schema 生成的 Prompt 中：

```typescript
const designContext = `
## 设计规范（必须遵守）

### 布局策略
- 类型：${design.layoutStrategy?.type}
- 容器最大宽度：${design.layoutStrategy?.containerMaxWidth}
- 页面背景色：${design.layoutStrategy?.pageBackground}

### 颜色方案
- 主色：${design.colorScheme?.primary}
- 背景色：${design.colorScheme?.background}
- 卡片背景：${design.colorScheme?.surface}

### 组件样式预设
${JSON.stringify(design.componentStyles, null, 2)}

请在生成组件时，将上述样式应用到对应组件的 styles 字段中。
`;
```

### 输出

```typescript
interface PageResult {
  reasoning?: string; // 可选的推理过程
  root: LinterNode; // 组件树根节点
}
```

## 3.5 Phase 4: Linter 后处理

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

### 页面级样式应用

```typescript
// 在 Linter 阶段应用 Design Chain 的页面样式
if (design.layoutStrategy?.pageBackground) {
  rootNode.styles.backgroundColor = design.layoutStrategy.pageBackground;
  rootNode.styles.minHeight = "100vh";
}
```

## 3.6 完整数据流图

```mermaid
flowchart TB
    subgraph Input
        A[text: string]
        B[image?: base64]
    end

    subgraph Phase1["Phase 1: 意图分析"]
        C[visionModel temp=0.3]
        D[IntentResult]
    end

    subgraph Phase2["Phase 2: 设计链 🆕"]
        E[designModel temp=0.4]
        F[DesignResult]
    end

    subgraph Phase3["Phase 3: Schema 生成"]
        G[动态物料筛选]
        H[设计规范注入]
        I[generationModel temp=0.1]
        J[PageResult]
    end

    subgraph Phase4["Phase 4: Linter"]
        K[fixComponentTree]
        L[应用页面样式]
        M[convertToComponentTree]
        N[ComponentNode[]]
    end

    A --> C
    B --> C
    C --> D
    D -->|layoutType, description| E
    E --> F
    D -->|suggestedComponents| G
    F -->|colorScheme, componentStyles| H
    G --> I
    H --> I
    I --> J
    J -->|root| K
    F -->|pageBackground| L
    K --> L
    L --> M
    M --> N
```
