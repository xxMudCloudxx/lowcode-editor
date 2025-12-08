# 4. Prompt 工程

## 4.1 Prompt 文件结构

```
server/prompts/
├── intent_system.md          # Phase 1: 意图分析系统提示词
├── schema_role.md            # Phase 2: 黄金规则定义
└── schema_system_template.md # Phase 2: Schema 生成模板
```

## 4.2 Phase 1: 意图分析提示词

**文件**: `intent_system.md`

### 角色定义

```
你是一个 **高级产品经理** 和 **资深 UI/UX 设计专家**。
```

### 核心设计原则

| 原则         | 描述                                   |
| ------------ | -------------------------------------- |
| 禁止简单转译 | 不能将"登录页面"仅转换为账号+密码+按钮 |
| 主动充实     | 必须补全 Logo、标题、注册链接等元素    |
| 生产级标准   | 以真实产品为标准，而非最小 Demo        |

### 关键指令

```markdown
## 关键原则：主动思考与补全 (The "Login Page" Principle)

1. **禁止简单转译**：当用户只给出一个简单的词（比如 "登录页面"），
   你 **不能** 只返回最基础的元素（如：账号、密码、登录按钮）。

2. **主动充实**：你 **必须** 主动思考一个 "生产级别" 的页面 **应该**
   包含哪些元素，并自动为用户补全。
```

### 输出约束

```json
{
  "description": "对页面功能的简要技术描述",
  "layoutType": "Dashboard | Form | List | Detail | Landing | Settings | Empty",
  "suggestedComponents": ["组件名1", "组件名2", ...]
}
```

## 4.3 Phase 2: Schema 生成提示词

### 4.3.1 黄金规则 (`schema_role.md`)

**核心约束表**：

| 规则编号 | 规则内容                                                |
| -------- | ------------------------------------------------------- |
| Rule 1   | 只能使用物料库中的组件                                  |
| Rule 2   | 严禁捏造未定义的组件名                                  |
| Rule 3   | 抽象概念必须映射到实际组件组合                          |
| Rule 10  | **父子嵌套约束**：Form → FormItem, Grid → GridColumn 等 |
| Rule 11  | **布局纠正**：Button 不能直接放在 Form 内               |

**关键规则示例**：

```markdown
【[核心] 严格父子嵌套规则】：

- `name: "Form"` 的 `children` 数组中 **只允许** 包含 `name: "FormItem"` 的组件。
- `name: "Grid"` 的 `children` 数组中 **只允许** 包含 `name: "GridColumn"` 的组件。

【[核心] 布局纠正（表单）】：

- **错误做法**：`{ "name": "Form", "children": [ { "name": "Button" } ] }`
- **正确做法**：Button 必须作为 Form 的**兄弟节点**，包裹在同一个父级 Container 中。
```

### 4.3.2 系统模板 (`schema_system_template.md`)

**思维链 (CoT) 引导**：

```markdown
## 思维链 (Chain of Thought)

在生成 JSON 之前，请按以下步骤思考：

1. **布局规划**：先确定页面的整体布局容器（Container、Grid）
2. **区域划分**：根据意图中的 sections，规划每个区域的容器结构
3. **组件填充**：在容器中填充原子组件（Button、Input、Typography 等）
4. **约束检查**：检查父子关系是否符合规则
```

**模板占位符**：

```markdown
## 黄金规则

{{ROLE_DEFINITION}} <!-- 注入 schema_role.md 内容 -->

## 【可用物料库】

{{MATERIALS_LIST}} <!-- 注入过滤后的物料 JSON -->

## 【黄金标准范例】

{{SCHEMA_EXAMPLE}} <!-- 预留，当前未使用 -->
```

## 4.4 Prompt 组装流程

```typescript
function loadPrompts() {
  const intentSystemPrompt = read("server/prompts/intent_system.md");
  const schemaRole = read("server/prompts/schema_role.md");
  const schemaSystemTemplate = read("server/prompts/schema_system_template.md");

  // 占位符替换
  const schemaSystemPrompt = schemaSystemTemplate.replace(
    "{{ROLE_DEFINITION}}",
    schemaRole
  );

  return { intentSystemPrompt, schemaSystemPrompt };
}

// 运行时动态注入物料
const finalSchemaPrompt = schemaSystemPrompt
  .replace("{{MATERIALS_LIST}}", materialContext)
  .replace("{{SCHEMA_EXAMPLE}}", "");
```

## 4.5 Prompt 设计决策分析

### 4.5.1 为什么使用"登录页面原则"？

**问题**：LLM 倾向于最小化输出，用户说"登录页"只会生成 2-3 个组件。

**解决方案**：通过具体例子强化"生产级补全"的概念。

### 4.5.2 为什么需要 CoT 思维链？

**问题**：复杂页面容器嵌套容易出错。

**解决方案**：强制 LLM 按"容器→区域→组件"的顺序思考。

### 4.5.3 为什么黄金规则如此详细？

**问题**：即使 Linter 能修复，预防优于修复。

**解决方案**：在 Prompt 层面就明确约束，减少后处理压力。

## 4.6 待优化项

| 问题           | 当前状态                  | 建议                     |
| -------------- | ------------------------- | ------------------------ |
| 范例注入       | `{{SCHEMA_EXAMPLE}}` 为空 | 添加 1-2 个高质量范例    |
| 多语言支持     | 仅中文 Prompt             | 考虑英文 Prompt 效果对比 |
| 布局类型未使用 | `layoutType` 未影响生成   | 引入布局模板             |
