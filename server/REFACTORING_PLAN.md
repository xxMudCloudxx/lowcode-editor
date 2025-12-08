# AI 页面生成器 - 企业级重构计划

> **文档版本**: 2.1 (架构评审修订版)  
> **创建日期**: 2025-12-09  
> **状态**: ✅ 架构评审通过，进入开发阶段  
> **评审评级**: A (架构深度) / A- (工程严谨度) / Low (落地风险)

---

## 📋 执行摘要

当前架构存在 **4 个核心问题**，阻碍其达到企业级水平：

| 问题     | 当前状态            | 企业级要求       | 优先级 |
| -------- | ------------------- | ---------------- | ------ |
| 物料召回 | 硬匹配 (filter)     | 语义检索 (RAG)   | P0     |
| CoT 实现 | JSON 内部 reasoning | 思考与格式化分离 | P0     |
| 用户体验 | 死寂 Loading        | SSE 流式传输     | P0     |
| 错误处理 | 直接崩溃            | 自我修正循环     | P1     |
| 质量保障 | 凭感觉开发          | 自动化评估       | P2     |

---

## 🏗️ 目标架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI Page Designer v2.0                           │
│                         (Enterprise Architecture)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────┐ │
│  │  Intent  │──▶│  Design  │──▶│  Schema  │──▶│ Validate │──▶│ Output││
│  │  Chain   │   │  Chain   │   │  Chain   │   │  + Loop  │   │       ││
│  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘   └───────┘ │
│       │              │              ▲              │                    │
│       │              │              │              │ Retry (max 3)      │
│       ▼              ▼              └──────────────┘                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RAG / Semantic Search                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │ Embeddings  │  │ Vector DB   │  │ Material Knowledge Base │  │   │
│  │  │ (OpenAI)    │  │ (LanceDB)   │  │ (materials-ai.json)     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Evaluation Pipeline                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │   │
│  │  │ Test Set │  │ Metrics  │  │ LangSmith│  │ Regression CI │   │   │
│  │  │ (Golden) │  │ (JSON OK)│  │ Tracing  │  │ (GitHub Actions)│   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 重构任务清单

### Phase 1: Prompt Engineering 重构 (P0) - 2 天

#### 1.1 CoT 分离：思考与格式化解耦

**问题**: 当前把 `reasoning` 字段放在 JSON 内部，强迫模型边生成结构化数据边思考。

**解决方案**: 采用 `<thinking>` + `<json>` 标签分离模式

```
# 现有 Prompt (错误)
请生成页面 Schema JSON：
{
  "reasoning": "...",  // ❌ 在 JSON 内部思考
  "root": { ... }
}

# 改进后 Prompt (正确)
First, analyze the layout structure in <thinking> tags.
Then, generate the JSON schema in <json> tags.

<thinking>
这是一个登录页面，需要：
1. 居中卡片布局
2. Logo + 标题
3. 表单区域...
</thinking>

<json>
{
  "name": "Page",
  "children": [...]
}
</json>
```

**实现要点**:

- 修改 `schema_system_template.md`，移除 `reasoning` 字段要求
- 新增自由格式思考区域 `<thinking>...</thinking>`
- 输出解析时使用正则提取 `<json>...</json>` 内容
- 参考: [Prompt Engineering Guide - CoT Best Practices](#13-cot-best-practices)

---

#### 1.2 Few-Shot 示例优化

**问题**: 当前 Prompt 缺少高质量示例，模型不知道"好的输出"长什么样。

**解决方案**: 添加 3-5 个黄金示例

```markdown
## 示例 1: 登录页面

<thinking>
登录页面的核心是表单认证，采用居中卡片布局。结构：
- Page (浅灰背景)
  - Container (白色卡片，居中)
    - Typography (标题)
    - Form
      - FormItem (用户名)
      - FormItem (密码)
      - Button (登录)
</thinking>

<json>
{
  "name": "Page",
  "styles": { "backgroundColor": "#f5f5f5", "minHeight": "100vh" },
  "children": [
    {
      "name": "Container",
      "styles": { "maxWidth": "400px", "margin": "100px auto", "padding": "40px", "backgroundColor": "#fff", "borderRadius": "8px" },
      "children": [...]
    }
  ]
}
</json>
```

**实现要点**:

- 创建 `server/prompts/examples/` 目录
- 添加 `login.md`, `dashboard.md`, `form.md` 等示例
- 动态加载并注入 Prompt
- 参考: [Prompt Engineering Guide - Few-shot](#one-shot--few-shot)

---

#### 1.3 SSE 流式接口 (v2.1 新增)

**问题**: 多阶段生成可能需要 15-30 秒，用户面对死寂 Loading 会误以为系统崩溃。

**解决方案**: 实现 Server-Sent Events 流式传输

**后端任务**:

```typescript
// server/routes/generateStream.ts
app.get("/api/generate-page-stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");

  const sendEvent = (type: string, data: any) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // 实时推送各阶段状态和 <thinking> 内容
  sendEvent("phase", { phase: "intent", message: "🧠 分析意图..." });
  // ...
});
```

**前端任务**:

```typescript
// src/editor/stores/aiPageDesigner.tsx
const eventSource = new EventSource(`/api/generate-page-stream?text=...`);
eventSource.addEventListener("thinking", (e) => {
  setThinkingText((prev) => prev + JSON.parse(e.data).content);
});
```

**实现要点**:

- SSE 连接中断重连处理
- JSON Chunking (分块拼接)
- 前端 Modal 实时显示思考过程

---

### Phase 2: RAG 语义检索 (P0) - 3 天

#### 2.1 物料向量化

**问题**: 当前 `getMaterialContext` 仅做硬匹配，依赖 Phase 1 猜测准确。

**解决方案**: 将物料库向量化，支持语义检索

```typescript
// 当前实现 (硬匹配)
function getMaterialContext(suggested: string[]) {
  return materials.filter((m) => suggested.includes(m.name)); // ❌ 依赖猜测
}

// 改进后实现 (语义检索)
async function getMaterialContext(userQuery: string, topK = 10) {
  const queryEmbedding = await embeddings.embed(userQuery);
  const results = await vectorStore.search(queryEmbedding, topK);
  return results.map((r) => r.material);
}
```

**技术选型**:

| 组件       | 推荐方案                        | 备选方案           |
| ---------- | ------------------------------- | ------------------ |
| Embeddings | OpenAI `text-embedding-3-small` | HuggingFace        |
| Vector DB  | LanceDB (本地, 零依赖)          | Pinecone (云端)    |
| 相似度     | Cosine Similarity               | Euclidean Distance |

**实现步骤**:

1. 安装依赖:

   ```bash
   pnpm add vectordb @lancedb/lancedb
   ```

2. 创建向量索引脚本 `scripts/embed-materials.ts`:

   ```typescript
   import { LanceDB } from "@lancedb/lancedb";
   import { OpenAIEmbeddings } from "@langchain/openai";

   const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
   const db = await LanceDB.connect("./server/vectordb");

   // 将 materials-ai.json 向量化
   for (const material of materials) {
     const text = `${material.name}: ${material.desc}. Props: ${material.props.join(", ")}`;
     const vector = await embeddings.embedQuery(text);
     await db.add({ name: material.name, vector, metadata: material });
   }
   ```

3. 修改 `server/index.ts` 使用向量检索

---

#### 2.2 混合检索策略

**问题**: 纯语义检索可能遗漏关键组件。

**解决方案**: Core Set + Semantic Recall 混合

```typescript
async function getMaterialContext(userQuery: string) {
  // 1. Core Set: 始终包含
  const coreComponents = ["Page", "Container", "Grid", "Typography", "Button"];

  // 2. Semantic Recall: 基于用户需求检索
  const semanticResults = await vectorStore.search(userQuery, 8);

  // 3. 合并去重
  const allComponents = new Set([
    ...coreComponents,
    ...semanticResults.map((r) => r.name),
  ]);

  return materials.filter((m) => allComponents.has(m.name));
}
```

---

### Phase 3: 自我修正循环 (P1) - 2 天

#### 3.1 JSON 解析容错

**问题**: JSON 格式错误直接导致 500 崩溃。

**解决方案**: 多层容错 + 自动修复

```typescript
import { jsonrepair } from "jsonrepair";

async function parseJsonWithFallback(text: string): Promise<any> {
  // 1. 尝试直接解析
  try {
    return JSON.parse(text);
  } catch (e1) {}

  // 2. 提取 <json> 标签内容
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e2) {}
  }

  // 3. 使用 jsonrepair 修复
  try {
    const repaired = jsonrepair(text);
    return JSON.parse(repaired);
  } catch (e3) {}

  throw new Error("JSON 解析失败");
}
```

**参考**: [Prompt Engineering Guide - JSON Repair](#11-json-repair)

---

#### 3.2 LLM 自我修正

**问题**: Linter 只能修复结构问题，无法修复语义错误。

**解决方案**: 引入验证-重试循环

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3): Promise<any> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 生成尝试 ${attempt}/${maxRetries}...`);

    // 如果有错误，注入错误信息
    const fullPrompt = lastError
      ? `${prompt}\n\n⚠️ 上次生成失败，错误: ${lastError}\n请修正后重新生成。`
      : prompt;

    try {
      const response = await model.invoke(fullPrompt);
      const json = await parseJsonWithFallback(response.content);

      // 验证 Schema 结构
      const validation = validateSchema(json);
      if (!validation.valid) {
        lastError = validation.errors.join("; ");
        continue;
      }

      return json;
    } catch (error) {
      lastError = error.message;
    }
  }

  throw new Error(`生成失败，已重试 ${maxRetries} 次`);
}
```

**架构升级路径**: 后续可迁移到 LangGraph 状态机

---

### Phase 4: 评估管道 (P2) - 2 天

#### 4.1 黄金数据集

**问题**: 无法量化 Prompt 调整效果。

**解决方案**: 创建测试数据集

```
server/
├── evaluation/
│   ├── dataset/
│   │   ├── login-page.json       # 输入 + 期望输出
│   │   ├── dashboard.json
│   │   ├── user-form.json
│   │   └── product-list.json
│   ├── metrics.ts                 # 评估指标
│   └── run-eval.ts                # 评估脚本
```

**数据集格式**:

```json
{
  "id": "login-page-001",
  "input": "一个简单的登录页面",
  "expectedIntent": {
    "layoutType": "Form",
    "suggestedComponents": ["Form", "FormItem", "Input", "Button"]
  },
  "expectedComponents": [
    "Page",
    "Container",
    "Form",
    "FormItem",
    "Input",
    "Button"
  ],
  "acceptanceCriteria": {
    "hasForm": true,
    "hasCenteredLayout": true,
    "hasSubmitButton": true
  }
}
```

---

#### 4.2 自动化评估指标

| 指标             | 定义            | 计算方式              |
| ---------------- | --------------- | --------------------- |
| JSON Valid Rate  | JSON 解析成功率 | `成功次数 / 总次数`   |
| Component Recall | 期望组件召回率  | `实际包含 / 期望包含` |
| Structure Valid  | 结构合法率      | `Linter 无错误的比例` |
| Style Coverage   | 样式覆盖率      | `有样式组件 / 总组件` |

```typescript
// server/evaluation/metrics.ts
export function evaluateResult(result: any, expected: TestCase): EvalResult {
  return {
    jsonValid: isValidJson(result),
    componentRecall: calculateRecall(result.components, expected.components),
    structureValid: linter.validate(result).isValid,
    styleCoverage: calculateStyleCoverage(result),
  };
}
```

---

#### 4.3 视觉自动化评估 (v2.1 新增，高阶优化)

**问题**: 人工标注 `layoutCorrectness` 不可持续。

**解决方案**: 使用 GPT-4o Vision 自动打分

```typescript
// server/evaluation/visualEval.ts
import puppeteer from "puppeteer";
import { ChatOpenAI } from "@langchain/openai";

async function evaluateVisually(
  schema: any,
  userPrompt: string
): Promise<number> {
  // 1. 渲染页面并截图
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    `http://localhost:3000/preview?schema=${encodeURIComponent(JSON.stringify(schema))}`
  );
  const screenshot = await page.screenshot({ encoding: "base64" });
  await browser.close();

  // 2. 使用 GPT-4o Vision 评分
  const visionModel = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
  const response = await visionModel.invoke([
    {
      type: "text",
      content: `用户需求: "${userPrompt}"

请查看这张页面截图，评估它是否满足用户需求:
1. 布局是否合理？
2. 组件是否完整？
3. 视觉效果如何？

请打分 0-10，并简要说明理由。
输出格式: { "score": 8, "reason": "..." }`,
    },
    {
      type: "image_url",
      image_url: { url: `data:image/png;base64,${screenshot}` },
    },
  ]);

  const result = JSON.parse(response.content as string);
  return result.score;
}
```

**优势**: 可在 CI 中自动运行 100 个测试用例，无需人工介入

---

## 📁 文件变更清单

### 新增文件

| 文件路径                           | 说明             |
| ---------------------------------- | ---------------- |
| `server/rag/embeddings.ts`         | Embeddings 服务  |
| `server/rag/vectorStore.ts`        | LanceDB 向量存储 |
| `server/validation/jsonParser.ts`  | 容错 JSON 解析   |
| `server/validation/retryLoop.ts`   | 自我修正循环     |
| `server/evaluation/dataset/*.json` | 测试数据集       |
| `server/evaluation/run-eval.ts`    | 评估脚本         |
| `server/prompts/examples/*.md`     | Few-shot 示例    |
| `scripts/embed-materials.ts`       | 向量化脚本       |

### 修改文件

| 文件路径                                   | 变更内容            |
| ------------------------------------------ | ------------------- |
| `server/index.ts`                          | 集成 RAG + 重试循环 |
| `server/prompts/schema_system_template.md` | CoT 分离            |
| `server/prompts/intent_system.md`          | 添加 Few-shot       |
| `package.json`                             | 新增依赖            |

### (v2.1 新增)

| 文件路径                               | 说明                   |
| -------------------------------------- | ---------------------- |
| `server/routes/generateStream.ts`      | SSE 流式接口           |
| `server/utils/extractJson.ts`          | 鲁棒 JSON 解析器       |
| `scripts/enrich-materials.ts`          | 物料元数据增强脚本     |
| `server/evaluation/visualEval.ts`      | GPT-4o Vision 视觉评估 |
| `src/editor/stores/aiPageDesigner.tsx` | 前端 EventSource 集成  |

---

## 🗓️ 实施时间线

```
Week 1
├── Day 1-2: Prompt Engineering 重构 (CoT 分离 + Few-shot)
├── Day 3: SSE 流式接口 (后端 + 前端 EventSource) ⚠️ v2.1 新增
├── Day 4-5: RAG 语义检索 (向量化 + 混合检索)

Week 2
├── Day 1-2: 自我修正循环 (鲁棒 JSON 解析 + 重试)
├── Day 3-4: 评估管道 (数据集 + 视觉自动化) ⚠️ v2.1 更新
├── Day 5: 集成测试 + 文档更新
```

---

## 📊 成功标准

| 指标           | 当前值 | 目标值 |
| -------------- | ------ | ------ | ------------ |
| JSON 有效率    | ~70%   | >95%   |
| 组件召回率     | ~60%   | >85%   |
| 首次生成成功率 | ~50%   | >80%   |
| 平均重试次数   | N/A    | <1.5   |
| 视觉评分       | N/A    | >7/10  | ⚠️ v2.1 新增 |

---

## 📚 参考资料

- [Prompt Engineering Guide (Google)](/docs/Prompt%20Engineering.md)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [json-repair Library](https://www.npmjs.com/package/jsonrepair)
