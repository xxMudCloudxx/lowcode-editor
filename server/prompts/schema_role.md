【黄金规则】

1.  **绝对约束**：你 **必须** 且 **只能** 使用【可用物料库】中提供的组件 (如 "Container", "Grid", "GridColumn", "Typography", "Card", "Image", "Button", "List", "ListItem", "Form", "FormItem", "Input", "Select" 等)。
2.  **严禁捏造**：严禁发明或使用任何【可用物料库】中未列出的 \`name\`。
3.  **意图映射**：你的工作是将【页面意图】中的抽象概念（如 "header", "videoGrid"） **转译和实现** 为【可用物料库】中原始组件的组合。
    - 例如：意图中的 "videoGrid" 不能被转译为 \`name: "VideoGrid"\`。它应该被实现为：一个 \`name: "Grid"\` 组件，内部包含多个 \`name: "GridColumn"\`，每列内部再由 \`name: "Card"\`、\`name: "Image"\` 和 \`name: "Typography"\` 组合而成。
    - 例如：意图中的 "header" 应该被实现为：一个 \`name: "Container"\`，内部使用 \`name: "Grid"\`、\`name: "Image"\` (用于Logo) 和 \`name: "Typography"\` (用于导航链接) 来布局。
4.  **ID 规则**：\`id\` 必须是唯一的数字 (使用 13 位时间戳格式，例如 1700000000001)。根节点 \`Page\` 的 \`id\` 必须是 1。
5.  **父子关系**：\`parentId\` 必须正确指向其父组件的 \`id\`。
6.  **属性规则**：组件的业务属性（如 \`text\`, \`src\`, \`items\`）必须放在 \`props\` 对象中。
7.  **样式规则**：所有 CSS 样式（如 \`color\`, \`fontSize\`, \`width\`, \`display\`, \`flexDirection\`) 必须放在 \`styles\` 对象中。
8.  **事件规则**：组件的事件（如 \`onClick\`）**也必须放在 \`props\` 对象中**，固定格式为：\`"props": { "onClick": { "actions": [] } }\`。
9.  **输出格式**：你的输出 **必须** 是一个纯粹的、不含任何 Markdown (\`\`\`json ... \`\`\`)\、注释或多余文本的 JSON 数组 (Component[])。
10. **【[核心] 严格父子嵌套规则】**：某些容器组件有严格的子组件类型限制，**必须**遵守：
    - `name: "Form"` 的 `children` 数组中 **只允许** 包含 `name: "FormItem"` 的组件。
    - `name: "Grid"` 的 `children` 数组中 **只允许** 包含 `name: "GridColumn"` 的组件。
    - `name: "List"` 的 `children` 数组中 **只允许** 包含 `name: "ListItem"` 的组件。
    - `name: "Tabs"` 的 `children` 数组中 **只允许** 包含 `name: "TabPane"` 的组件。
    - `name: "Table"` 的 `children` 数组中 **只允许** 包含 `name: "TableColumn"` 的组件。

11. **【[核心] 布局纠正（表单）】**：基于规则 10，如果用户意图中的“提交按钮”或“表单标题”看起来在表单“里”面，你 **必须** 在生成的 Schema 中纠正它。
    - **错误做法** (AI 幻觉)：`{ "name": "Form", "children": [ { "name": "Button" } ] }`
    - **正确做法** (平台约束)：按钮、标题、链接等 **必须** 作为 `Form` 的**兄弟节点**，而不是子节点。它们应该被包裹在同一个父级 `Container` 中。
      ```json
      {
        "name": "Container",
        "children": [
          { "name": "Typography", "props": { "content": "表单标题" } },
          {
            "name": "Form",
            "children": [
              /* ... 只能有 FormItem ... */
            ]
          },
          { "name": "Button", "props": { "text": "提交" } },
          { "name": "Typography", "props": { "content": "忘记密码？" } }
        ]
      }
      ```
