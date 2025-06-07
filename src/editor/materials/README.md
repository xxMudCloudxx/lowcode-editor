# 物料组件开发规范

本文档旨在说明本低代码编辑器中“物料组件”的设计模式与开发规范。所有位于 `src/editor/materials/` 目录下的组件都应遵循此规范。

## 核心设计理念：`dev` 与 `prod` 分离

为了将**编辑器环境的交互逻辑**与**最终线上运行的纯净业务逻辑**解耦，我们为每个物料组件都设计了两个版本：

1.  **`dev.tsx` (开发版本)**：

    - **用途**：仅用于在编辑器的主画布 (`EditArea`) 中进行渲染。
    - **职责**：负责所有与编辑器相关的交互，例如拖拽 (`useDrag`)、接收放置 (`useDrop`)、显示选中/悬浮的边框和标签等。它是一个“重量级”的、带有编辑器“外壳”的组件。
    - **关键实现**：必须在其根元素上附加 `data-component-id={id}` 属性，以便 `EditArea` 的事件委托机制能够识别它。

2.  **`prod.tsx` (生产版本)**：
    - **用途**：用于在“预览”模式 (`Preview`) 和未来可能导出的生产代码中进行渲染。
    - **职责**：它是一个纯净、高性能的 React 业务组件，只关心接收 props 并渲染 UI。它不应包含任何 `react-dnd` 或其他编辑器专用的 Hooks 和逻辑。
    - **关键实现**：如果组件需要暴露方法（如 `Modal` 的 `open`），或处理由事件编排系统触发的事件（如 `Button` 的 `onClick`），应在这里实现。

---

## 标准文件结构

每个物料组件都应遵循以下目录结构：

```
materials/
└── Button/
    ├── dev.tsx     # 开发版本
    └── prod.tsx    # 生产版本
```

---

## 如何新增一个物料组件 (以 `Tag` 组件为例)

1.  **创建文件**：

    - 在 `materials/` 目录下创建新文件夹 `Tag/`。
    - 在 `Tag/` 中创建 `dev.tsx` 和 `prod.tsx`。

2.  **实现组件逻辑**：

    - 在 `prod.tsx` 中，实现纯净的 `Tag` 业务组件。
    - 在 `dev.tsx` 中，引入 `prod.tsx` 或重新实现一个带有拖拽等交互逻辑的 `Tag` 组件。务必添加 `data-component-id` 属性。

3.  **注册组件配置**：

    - 打开 `src/editor/stores/component-config.tsx` 文件。
    - 引入 `Tag` 组件的 `dev` 和 `prod` 版本。
    - 在 `componentConfig` 对象中，新增一个 `Tag` 的配置项，定义其 `name`, `desc`, `defaultProps`, `setter` 等，并正确指向引入的 `dev` 和 `prod` 组件。

4.  **更新容器的可接受类型**：

    - 如果 `Tag` 组件需要被放置在某个容器（如 `Page` 或 `Container`）中，需要找到该容器的 `dev.tsx` 文件。
    - 在 `useMaterailDrop` Hook 的 `accept` 数组参数中，加入 `'Tag'`。

遵循以上步骤，即可完成一个新物料的接入。
