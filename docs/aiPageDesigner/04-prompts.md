# 4. Prompt 工程

## 4.1 Prompt 文件结构

```
server/prompts/
├── intent_system.md          # Phase 1: 意图分析系统提示词
├── design_system.md          # Phase 2: 设计链系统提示词 (新增!)
├── schema_role.md            # Phase 3: 黄金规则定义
└── schema_system_template.md # Phase 3: Schema 生成模板
```

## 4.2 Phase 1: 意图分析提示词

**文件**: `intent_system.md`

### 角色定义

> 你是一个 **高级产品经理** 和 **资深 UI/UX 设计专家**。

### 核心设计原则

| 原则         | 描述                                   |
| ------------ | -------------------------------------- |
| 禁止简单转译 | 不能将"登录页面"仅转换为账号+密码+按钮 |
| 主动充实     | 必须补全 Logo、标题、注册链接等元素    |
| 生产级标准   | 以真实产品为标准，而非最小 Demo        |

### 输出约束

```json
{
  "description": "对页面功能的简要技术描述",
  "layoutType": "Dashboard | Form | List | Detail | Landing | Settings | Empty",
  "suggestedComponents": ["组件名1", "组件名2", ...]
}
```

## 4.3 Phase 2: 设计链提示词 (新增!)

**文件**: `design_system.md`

### 角色定义

> 你是一个**高级 UI 设计师**，专注于创建美观、专业的页面视觉设计。

### 核心任务

基于用户需求和意图分析结果，输出页面的**视觉设计方案**：

- 整体布局策略
- 颜色方案
- 排版层次（字体大小、粗细）
- 间距规范
- 关键组件的样式预设

### 设计原则

```markdown
1. **现代简约**：使用干净的布局，充足的留白
2. **视觉层次**：通过大小、颜色、粗细区分信息层级
3. **一致性**：统一的颜色、间距、圆角
4. **专业感**：避免花哨，追求商务/产品级别的质感
```

### 布局策略参考

| 页面类型  | 推荐布局  | 容器宽度  | 背景              |
| --------- | --------- | --------- | ----------------- |
| 登录/注册 | 居中卡片  | 360-420px | 浅灰背景+白色卡片 |
| 表单页    | 单列居中  | 600-800px | 白色背景          |
| 仪表盘    | 网格布局  | 全宽      | 浅灰背景          |
| 列表页    | 卡片/表格 | 全宽      | 白色背景          |
| 详情页    | 两栏布局  | 1200px    | 白色背景          |

### 颜色方案模板

**商务蓝调**（默认）：

| 用途     | 颜色值  |
| -------- | ------- |
| 主色     | #1677ff |
| 页面背景 | #f5f5f5 |
| 卡片背景 | #ffffff |
| 标题文字 | #1f1f1f |
| 正文文字 | #666666 |
| 边框     | #e8e8e8 |

### 输出格式

```json
{
  "layoutStrategy": {
    "type": "centered-card | full-width | sidebar | two-column",
    "containerMaxWidth": "400px",
    "containerPadding": "40px",
    "containerBackground": "#ffffff",
    "pageBackground": "#f5f5f5"
  },
  "colorScheme": {
    "primary": "#1677ff",
    "background": "#f5f5f5",
    "surface": "#ffffff",
    "text": "#1f1f1f",
    "textSecondary": "#666666"
  },
  "componentStyles": {
    "Container": { "maxWidth": "400px", "margin": "40px auto" },
    "Button_primary": { "width": "100%", "height": "40px" }
  }
}
```

## 4.4 Phase 3: Schema 生成提示词

### 4.4.1 黄金规则 (`schema_role.md`)

**核心约束表**：

| 规则编号 | 规则内容                                                |
| -------- | ------------------------------------------------------- |
| Rule 1   | 只能使用物料库中的组件                                  |
| Rule 2   | 严禁捏造未定义的组件名                                  |
| Rule 10  | **父子嵌套约束**：Form → FormItem, Grid → GridColumn 等 |
| Rule 11  | **布局纠正**：Button 不能直接放在 Form 内               |

### 4.4.2 系统模板 (`schema_system_template.md`)

**思维链 (CoT) 引导**：

```markdown
## 思维链 (Chain of Thought)

1. **布局规划**：先确定页面的整体布局容器
2. **区域划分**：规划每个区域的容器结构
3. **组件填充**：在容器中填充原子组件
4. **约束检查**：检查父子关系是否符合规则
```

### 4.4.3 设计规范注入

在 Phase 3 调用时，会动态注入 Phase 2 的设计结果：

```typescript
const designContext = `
## 设计规范（必须遵守）

### 布局策略
- 类型：${design.layoutStrategy?.type || "centered-card"}
- 容器最大宽度：${design.layoutStrategy?.containerMaxWidth || "400px"}
- 页面背景色：${design.layoutStrategy?.pageBackground || "#f5f5f5"}

### 颜色方案
- 主色：${design.colorScheme?.primary || "#1677ff"}
- 背景色：${design.colorScheme?.background || "#f5f5f5"}
- 卡片背景：${design.colorScheme?.surface || "#ffffff"}

### 组件样式预设
${JSON.stringify(design.componentStyles || {}, null, 2)}

请在生成组件时，将上述样式应用到对应组件的 styles 字段中。
`;

// 组合最终 Prompt
const schemaMessages = [
  new SystemMessage(finalSchemaPrompt + "\n\n" + designContext),
  new HumanMessage(...)
];
```

## 4.5 Prompt 组装流程

```typescript
function loadPrompts() {
  const intentSystemPrompt = read("server/prompts/intent_system.md");
  const designSystemPrompt = read("server/prompts/design_system.md"); // 新增!
  const schemaRole = read("server/prompts/schema_role.md");
  const schemaSystemTemplate = read("server/prompts/schema_system_template.md");

  const schemaSystemPrompt = schemaSystemTemplate.replace(
    "{{ROLE_DEFINITION}}",
    schemaRole
  );

  return { intentSystemPrompt, designSystemPrompt, schemaSystemPrompt };
}
```

## 4.6 Prompt 设计决策分析

### 4.6.1 为什么新增设计链？

**问题**：v3 版本生成的页面样式单调、不专业

**解决方案**：通过独立的设计阶段，让 AI 像真正的设计师一样思考：

1. 先确定整体风格（布局类型、配色）
2. 再决定具体样式（间距、圆角、阴影）
3. 最后生成组件时应用这些样式

### 4.6.2 为什么设计模型温度更高？

| 阶段        | Temperature | 理由                   |
| ----------- | ----------- | ---------------------- |
| 意图分析    | 0.3         | 需要准确理解用户意图   |
| 设计链      | 0.4         | 允许更多创意和风格变化 |
| Schema 生成 | 0.1         | 严格遵循结构，减少幻觉 |

### 4.6.3 设计规范如何传递到 Schema 生成？

通过 **Prompt 注入** 的方式，将设计链的输出格式化后拼接到 Schema 生成的系统提示词中，确保 generationModel 能够"看到"并遵循设计规范。
