# 物料组件开发规范

本文档旨在说明本低代码编辑器中“物料组件”的设计模式与开发规范。所有位于 `src/editor/materials/` 目录下的组件都应遵循此规范。

## 核心设计理念：`dev` 与 `prod` 分离

为了将**编辑器环境的交互逻辑**与**最终线上运行的纯净业务逻辑**彻底解耦，我们为每个物料组件都设计了两个版本：

1.  **`dev.tsx` (开发版本)**：

    - **用途**：仅用于在编辑器的主画布 (`EditArea`) 中进行渲染。
    - **职责**：负责所有与编辑器相关的交互，例如拖拽 (`useDrag`)、接收放置 (`useDrop`)、显示选中/悬浮的边框和标签等。它是一个“重量级”的、带有编辑器“外壳”的组件。
    - **关键实现**：必须在其根元素上附加 `data-component-id={id}` 属性，以便 `EditArea` 的事件委托机制能够识别它。

2.  **`prod.tsx` (生产版本)**：
    - **用途**：用于在“预览”模式 (`Preview`) 和未来可能导出的生产代码中进行渲染。
    - **职责**：它是一个纯净、高性能的 React 业务组件，只关心接收 props 并渲染 UI。它不应包含任何 `react-dnd` 或其他编辑器专用的 Hooks 和逻辑。
    - **关键实现**：如果组件需要暴露方法（如 `Modal` 的 `open`），或处理由事件编排系统触发的事件（如 `Button` 的 `onClick`），应在这里实现。

## SOP: 新增一个物料组件 (自动化注册)

得益于项目的自动化注册机制，新增一个物料组件的流程非常简单、清晰，且**无需修改任何现有核心文件**。

### 第一步：创建标准文件结构

在 `src/editor/materials/` 目录下，为你的新组件创建一个文件夹，并在其中创建三个核心文件：

```
materials/
└── NewComponent/
├── dev.tsx      \# 开发版本 (负责编辑器交互)
├── prod.tsx     \# 生产版本 (负责最终渲染)
└── meta.tsx     \# 元数据配置文件
```

### 第二步：实现 `dev` 和 `prod` 组件

按照上文“核心设计理念”的要求，分别实现 `dev.tsx` 和 `prod.tsx`。

**开发版本 (`dev.tsx`) 实现要点**：

- **容器类组件** (如: Page, Container, Form) 必须同时使用 `useDrag` 和我们封装的 `useMaterailDrop` Hook。
- 为了实现干净、无冲突的视觉反馈，`className` 应遵循以下特定模式：

  ```tsx
  // 以 Container/dev.tsx 为例
  className={`min-h-[100px] p-[20px] -ml-px -mt-px ${
    isSelected
      ? '' // 选中时，隐藏自身所有边框，交由 SelectedMask 处理
      : `border-[1px] border-[#000] ${
          isOver ? "outline outline-blue-600" : "" // 使用 outline 避免布局抖动
        }`
  }`}
  ```

  这种模式结合了 **负外边距** (解决边框倍增)、**三元判断** (将选中样式全权交给 `SelectedMask`) 和 **`outline` 属性** (防止悬浮时布局抖动) 三个最佳实践。

- **普通组件** (如 Button) 只需使用 `useDrag` Hook 使其可被拖拽即可。

### 第三步：配置 `meta.tsx` (核心)

这是将你的组件集成到编辑器生态中的**唯一**一步。`meta.tsx` 文件负责导出该组件的所有元数据。构建系统会自动发现并加载这个文件。

**示例 (`Button/meta.tsx`)**：

```typescript
import type { ComponentConfig } from "../../stores/component-config";

// 直接导出一个符合规范的配置对象
export default {
  // --- 基础信息 ---
  name: "Button", // 核心标识: 组件的唯一英文类型名。
  desc: "按钮", // UI展示: 在左侧物料面板显示的名称。

  // --- 拖拽规则 ---
  // 定义此组件可被拖入的父容器类型列表。
  // useMaterailDrop Hook 会自动识别此配置。
  parentTypes: ["Page", "Container", "Modal"],

  // --- 默认数据 ---
  defaultProps: {
    // 初始属性: 组件从物料区初次拖入时的默认props。
    type: "primary",
    text: "按钮",
  },

  // --- 属性配置器 (右侧“属性”面板) ---
  setter: [
    {
      name: "type",
      label: "按钮类型",
      type: "select",
      options: [
        /* ... */
      ],
    },
    // ...更多属性配置
  ],

  // --- 样式配置器 (右侧“样式”面板) ---
  styleSetter: [
    /* ... */
  ],

  // --- 事件配置器 (右侧“事件”面板) ---
  events: [{ name: "onClick", label: "点击事件" }],

  // --- 方法配置器 (用于事件动作) ---
  methods: [
    /* ... */
  ],
} as Omit<ComponentConfig, "dev" | "prod">; // 使用 Omit 排除 dev 和 prod
```

#### **核心属性详解:**

- **`name: string`**: **唯一标识符**。它必须与你的组件类型名严格一致，`useDrag` 和 `useDrop` 都依赖它来识别组件。
- **`desc: string`**: **UI 显示名**。显示在左侧物料面板上，给用户看。
- **`parentTypes: string[]`**: **放置规则**。这是一个“白名单”，定义了哪些容器组件可以“接受”这个新物料。我们的 `useMaterailDrop` Hook 会智能地读取所有物料的 `parentTypes` 来动态生成自己的 `accept` 列表，这使得整个系统高度解耦和可扩展。
- **`defaultProps: object`**: **出厂设置**。当用户从物料面板拖出一个新组件时，这些属性会被应用到新创建的组件实例上。
- **`setter`/`styleSetter`: object[]**：**动态表单生成器**。这个数组决定了当用户选中此组件时，右侧“属性”和“样式”面板显示的内容。数组中的每个对象都定义了一个表单控件（如`input`, `select`），用于修改组件的某个`prop`或`style`。
- **`events`/`methods`: object[]**：**事件与方法**。定义了组件可对外触发的事件和可被调用的方法，用于事件编排。

---

### 第四步：验证

完成以上步骤后，**无需任何额外操作**，直接重启项目。你的新组件应该已经自动出现在左侧物料面板中，并可以正常地拖拽、放置、配置和预览了。
