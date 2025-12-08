# 7. 待改进项与未来规划

## 7.1 已知问题

### 7.1.1 设计链样式应用不完整

**问题**: `componentStyles` 中的样式未能 100% 应用到组件

**原因**: 依赖 LLM 在 Phase 3 自行读取并应用样式

**建议**: 在 Linter 阶段增加样式注入逻辑

---

### 7.1.2 多格式输出容错

**问题**: JsonOutputParser 可能返回多种格式

**当前方案**: Linter 中增加了三种格式的容错处理

```typescript
if (pageResult.root) {
  rootNode = pageResult.root;
} else if (Array.isArray(pageResult)) {
  rootNode = pageResult[0];
} else {
  rootNode = pageResult;
}
```

---

### 7.1.3 物料覆盖不完整

**缺失组件**: ProTable, ProForm, ProList 等高级业务组件

---

## 7.2 性能优化建议

### 7.2.1 设计链缓存

对于相同 `layoutType`，可以缓存设计方案：

```typescript
const designCache = new Map<string, DesignResult>();
```

### 7.2.2 流式输出

当前四阶段串行，可考虑 SSE 流式返回各阶段结果。

---

## 7.3 功能增强建议

### 7.3.1 设计模板库

预设多套设计方案供用户选择：

- 商务蓝调（默认）
- 科技紫
- 自然绿
- 暗黑模式

### 7.3.2 样式微调

允许用户在生成后微调设计参数：

```typescript
interface DesignOverrides {
  primaryColor?: string;
  containerWidth?: string;
}
```

### 7.3.3 布局模板

根据 `layoutType` 注入预设骨架结构。

---

## 7.4 优先级矩阵

| 改进项          | 影响 | 难度 | 优先级 |
| --------------- | ---- | ---- | ------ |
| Linter 样式注入 | 高   | 中   | ⭐⭐⭐ |
| 设计模板库      | 高   | 低   | ⭐⭐⭐ |
| 流式输出        | 中   | 中   | ⭐⭐   |
| 高级组件支持    | 中   | 高   | ⭐     |

---

## 7.5 版本规划

| 版本 | 目标                                |
| ---- | ----------------------------------- |
| v4.1 | Linter 阶段自动注入 componentStyles |
| v4.2 | 预设设计模板库                      |
| v5.0 | 多模态增强：像素级还原设计稿        |
