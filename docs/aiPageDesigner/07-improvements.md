# 7. 待改进项与未来规划

## 7.1 已知问题

### 7.1.1 类型安全问题

**问题**: `schemas.ts` 中 `PageResult.root` 类型为 `unknown`

```typescript
// 当前代码
const fixedRoot = fixComponentTree(pageResult.root as unknown as LinterNode);
// ^^^^^^^^^^^^^^ 强制类型断言
```

**原因**: Zod 的递归 Schema 类型推断存在限制

**建议**: 考虑使用显式类型声明或升级 Zod 版本

---

### 7.1.2 物料覆盖不完整

**问题**: 部分 Ant Design Pro 组件未纳入物料库

**缺失组件**:

- ProTable
- ProForm
- ProList
- ProCard
- 等高级业务组件

**建议**: 根据实际业务需求逐步补充

---

### 7.1.3 样式生成能力有限

**问题**: AI 生成的 `styles` 字段通常较为简单

**现状**:

```json
{
  "styles": { "margin": "0 auto", "maxWidth": "400px" }
}
```

**理想**:

```json
{
  "styles": {
    "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "borderRadius": "8px",
    "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
  }
}
```

**建议**: 在 Prompt 中添加样式设计指南

---

### 7.1.4 布局类型未充分利用

**问题**: `IntentResult.layoutType` 字段未影响生成

**现状**: layoutType 仅作为信息记录，未注入布局模板

**建议**:

```typescript
// 根据 layoutType 注入不同的布局骨架
const layoutTemplates = {
  Dashboard: {
    /* 仪表盘骨架 */
  },
  Form: {
    /* 表单页骨架 */
  },
  List: {
    /* 列表页骨架 */
  },
};
```

---

## 7.2 性能优化建议

### 7.2.1 缓存物料上下文

**问题**: 每次请求都重新构建 materialContext

**建议**:

```typescript
const materialContextCache = new Map<string, string>();

function getMaterialContext(suggestedComponents: string[]): string {
  const cacheKey = suggestedComponents.sort().join(",");
  if (materialContextCache.has(cacheKey)) {
    return materialContextCache.get(cacheKey)!;
  }
  // ... 构建逻辑
  materialContextCache.set(cacheKey, context);
  return context;
}
```

### 7.2.2 流式输出支持

**问题**: 当前是等待完整响应后返回

**建议**: 支持 Server-Sent Events (SSE) 流式返回

```typescript
// 伪代码
app.post("/api/generate-page-stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");

  // Phase 1 完成后先返回意图
  res.write(`data: ${JSON.stringify({ phase: 1, intent })}\n\n`);

  // Phase 2-3 完成后返回最终结果
  res.write(`data: ${JSON.stringify({ phase: 3, result })}\n\n`);
  res.end();
});
```

### 7.2.3 并行化优化

**问题**: 三阶段严格串行

**分析**: Phase 2 必须依赖 Phase 1 的 suggestedComponents，无法并行

**建议**: 如果未来支持多页面生成，可以多页面并行处理

---

## 7.3 功能增强建议

### 7.3.1 范例注入

**现状**: `{{SCHEMA_EXAMPLE}}` 占位符未使用

**建议**: 添加 2-3 个高质量范例

````markdown
## 【黄金标准范例】

### 范例 1: 登录页面

输入: "生成一个简洁的登录页面"
输出:

```json
{
  "name": "Page",
  "children": [...]
}
```
````

````

### 7.3.2 迭代优化能力

**现状**: 每次生成都是从零开始

**建议**: 支持对已有 Schema 进行增量修改

```typescript
interface IterativeRequest {
  baseSchema: ComponentNode;       // 现有 Schema
  modification: string;            // "在表单下方添加一个取消按钮"
}
````

### 7.3.3 多模态增强

**现状**: 图片理解仅在 Phase 1 使用

**建议**: 允许 Phase 2 也参考图片进行像素级还原

---

## 7.4 可测试性改进

### 7.4.1 单元测试覆盖

**现状**: 无自动化测试

**优先测试目标**:

1. `fixComponentTree()` - 所有父子约束规则
2. `convertToComponentTree()` - ID 生成正确性
3. `getMaterialContext()` - Core + Recall 逻辑

**测试框架建议**: Vitest

### 7.4.2 端到端测试

**建议**: 创建标准化测试用例集

```typescript
const testCases = [
  {
    input: "登录页面",
    expectedComponents: ["Form", "FormItem", "Input", "Button"],
  },
  { input: "数据仪表盘", expectedComponents: ["Grid", "Card", "Typography"] },
];
```

---

## 7.5 架构优化建议

### 7.5.1 Schema 版本化

**问题**: 无法追踪 Schema 结构变更

**建议**:

```typescript
const PageSchema = z.object({
  version: z.literal("1.0"), // 添加版本字段
  reasoning: z.string(),
  root: ComponentSchema,
});
```

### 7.5.2 可观测性

**问题**: 生产环境难以调试

**建议**:

1. 结构化日志（JSON 格式）
2. 请求追踪 ID
3. LLM 调用延迟监控
4. Token 使用统计

```typescript
logger.info({
  traceId: req.headers["x-trace-id"],
  phase: 1,
  duration: 1234,
  tokensUsed: { prompt: 500, completion: 200 },
});
```

---

## 7.6 优先级矩阵

| 改进项       | 影响 | 难度 | 优先级 |
| ------------ | ---- | ---- | ------ |
| 类型安全修复 | 中   | 低   | ⭐⭐⭐ |
| 范例注入     | 高   | 低   | ⭐⭐⭐ |
| 单元测试     | 中   | 中   | ⭐⭐⭐ |
| 布局模板     | 高   | 中   | ⭐⭐   |
| 流式输出     | 中   | 中   | ⭐⭐   |
| 样式增强     | 高   | 高   | ⭐     |
| 迭代修改     | 高   | 高   | ⭐     |
