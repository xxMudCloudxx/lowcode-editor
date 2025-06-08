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

## SOP: 新增一个物料组件

### 第一步：创建文件与实现 `prod` 版本

1.  在 `src/editor/materials/` 下创建新目录，如 `Alert/`。
2.  在其中创建 `prod.tsx` 和 `dev.tsx`。
3.  首先完成 `prod.tsx` 的编码，它应为一个接收 `props` 并渲染UI的纯函数组件。

### 第二步：实现 `dev` 版本 (分类讨论)

所有 `dev` 组件都必须在根元素上附加 `data-component-id={id}` 属性。根据组件特性，其实现分为以下两种情况：

#### 情况一：简单可拖拽组件 (如: Button, Alert)

这类组件只作为“拖拽源”（Drag Source），实现相对简单。

**关键实现**: 使用 `useDrag` Hook 使其可被拖拽移动。

**示例 (`Alert/dev.tsx`)**:
```tsx
import { useDrag } from 'react-dnd';
// ...
const AlertDev = ({ id, name, ...props }: CommonComponentProps) => {
  const [_, dragRef] = useDrag({
    type: name,
    item: { id, type: name, dragType: 'move' },
  });

  return (
    <div ref={dragRef} data-component-id={id} style={props.styles}>
      {/* 组件的预览形态 */}
    </div>
  );
};
```

#### 情况二：容器类组件 (如: Page, Container, Form)

这类组件既是“拖拽源”，又是“放置目标”（Drop Target），实现上需要处理更复杂的视觉交互。

**关键实现**:
1.  同时使用 `useDrag` 和我们封装的 `useMaterailDrop` Hook。
2.  采用一套精巧的 `className` 模式来处理边框和高亮，避免视觉冲突和布局抖动。

**精妙的 `className` 样式处理：**

为了实现干净、无冲突的视觉反馈，容器类组件的 `className` 应遵循以下特定模式：

```tsx
// 以 Container/dev.tsx 为例
className={`min-h-[100px] p-[20px] -ml-px -mt-px ${
  isSelected
    ? '' // 选中时，隐藏自身所有边框，交由 SelectedMask 处理
    : `border border-solid border-black ${isOver ? 'outline outline-2 outline-blue-500' : ''}`
}`}
```

这行代码包含了我们多次优化沉淀下的三个最佳实践：
- **`-ml-px -mt-px`**: **解决边框倍增问题**。通过负外边距技巧，让紧邻的两个容器的 `1px` 边框完美重叠为一条线。
- **`isSelected ? '' : ...`**: **解决选中时边框重叠问题**。当组件被选中时 (`isSelected` 为 `true`)，主动放弃自身的边框和轮廓样式，将视觉表现完全交给 `SelectedMask`，确保了选中状态的视觉唯一性。
- **`isOver ? 'outline...' : ''`**: **解决悬浮时布局抖动问题**。使用不影响盒模型尺寸的 `outline` 属性来显示悬浮高亮，避免了因动态改变 `border-width` 而引起的页面“抖动”。


### 第三步：注册组件配置 (核心)

组件文件创建完毕后，必须到“物料注册中心”——`src/editor/stores/component-config.tsx`——进行登记。这一步是将你的组件正式集成到编辑器生态中的关键。

**1. 导入组件:** 在文件顶部，导入新物料的 `dev` 和 `prod` 版本。

```ts
import AlertDev from "../materials/Alert/dev";
import AlertProd from "../materials/Alert/prod";
```

**2. 添加配置对象:** 在 `componentConfig` 字典中，添加一个以你的组件名（`Alert`）为键的新条目。

**示例 (`Alert` 组件的完整配置):**
```ts
// ...
Alert: {
  // --- 基础信息 ---
  name: "Alert",             // 核心标识: 组件的唯一英文类型名。
  desc: "警告提示",           // UI展示: 在左侧物料面板显示的名称。

  // --- 组件实现 ---
  dev: AlertDev,              // 编辑器渲染器: 指向 dev.tsx 的组件。
  prod: AlertProd,            // 生产/预览渲染器: 指向 prod.tsx 的组件。

  // --- 拖拽规则 ---
  parentTypes: ["Page", "Container"], // 放置规则: 定义此组件可被拖入的父容器类型。

  // --- 默认数据 ---
  defaultProps: {             // 初始属性: 组件从物料区初次拖入时的默认props。
    message: "这是一个提示",
    type: "info",
  },

  // --- 属性配置器 (右侧面板) ---
  setter: [                   // 定义在“属性”面板中可配置的表单项。
    { name: "message", label: "标题", type: "input" },
    {
      name: "type",
      label: "类型",
      type: "select",
      options: [ /* ... */ ],
    },
  ],
},
// ...
```

#### **核心属性详解:**

-   **`name: string`**: **唯一标识符**。它必须与你的组件类型名严格一致，`useDrag` 和 `useDrop` 都依赖它来识别组件。
-   **`desc: string`**: **UI显示名**。显示在左侧物料面板上，给用户看。
-   **`dev/prod: React.ComponentType`**: **组件渲染器**。分别链接到 `dev` 和 `prod` 版本的组件实现。
-   **`parentTypes: string[]`**: **放置规则**。这是一个“白名单”，定义了哪些容器组件可以“接受”这个新物料。我们的 `useMaterailDrop` Hook 会智能地读取所有物料的 `parentTypes` 来动态生成自己的 `accept` 列表，这使得整个系统高度解耦和可扩展。
-   **`defaultProps: object`**: **出厂设置**。当用户从物料面板拖出一个新组件时，这些属性会被应用到新创建的组件实例上。
-   **`setter: object[]`**: **动态表单生成器**。这个数组决定了当用户选中此组件时，右侧“属性”面板显示的内容。数组中的每个对象都定义了一个表单控件（如`input`, `select`），用于修改组件的某个`prop`。

---

### 第四步：验证

完成以上步骤后，重启项目并进行验证，确保新增物料的拖拽、放置、配置和预览功能全部正常。

