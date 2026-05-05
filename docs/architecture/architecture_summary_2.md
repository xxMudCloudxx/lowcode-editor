# 🚀 企业级低代码平台前端架构分解 (面向大厂简历与面试)

在此项目中，我们摒弃了传统的单体巨石应用结构，采用了横向解耦的 **Monorepo 多包架构**，并在视图展示层深度融合了 **Antd v5 的双令牌 (Token) 体系**。整个前端架构自底向上可划分为以下 **7 大核心模块**，具有极强的可拓展性：

## 1. `@lowcode/schema` - 全局规范与防腐层 (Protocol Layer)
*   **关联路径**：`packages/schema/src/` (含 `protocol.ts` 与 `component.ts`)
*   **职责**：架构的标准协议缔造者。定义了 `ComponentProtocol` 和运行时 `JSON Schema` 的数据结构。
- **架构价值**：它是系统的“法律”，所有的物料引擎、渲染引擎和出码流水线都只认 Schema 接口。这从物理层面斩断了各个包之间的隐式耦合。

## 2. `@lowcode/materials` - 泛生态物料工厂 (Material Ecosystem)
*   **关联路径**：`packages/materials/src/`
*   **职责**：以底层 Schema 为壳，将任何第三方的 UI 组件（如 Antd、AntV）经过 **“低侵入式的高阶组件封装 (forwardRef代理)”** 后，转化成能在画布上拖拽并受配置面板控制的标准化物料。
- **架构价值**：真正实现了**“编辑器与组件库的解耦”**，未来可以轻松拔插第三方 npm 物料包。

## 3. `UI 主题渲染系统` - 基于 Antd 的双令牌 UI 分层架构 (Dual-Token UI Architecture)
*   **关联路径**：`packages/editor/src/theme/` 与动态注入的主题 Context
*   **职责**：接管低代码产物和编辑界面的样式定制与主题切换。
- **架构价值**（简历超级亮点）：利用 Ant Design V5 的 CSS-in-JS 特性和动态 Token 机制，设计了 **Global Token（全局令牌/品牌基底）** 与 **Component Token（组件级令牌/局部覆写）** 的双层主题控制流。
  - **全局规范引擎**：在编辑器的“全局设置”面板，用户一键修改 `Seed Token`（如主色、圆角），系统自动利用演算法算出整套渐变色板，实时应用到整个搭建产物中。
  - **组件级基因突变**：在单个组件的“样式属性面板”中，直接覆写局部的 `Component Token`。
  - **优势**：彻底摒弃了传统低代码平台注入海量冗余 CSS 字符串、依赖强覆盖选择器的弊端，实现了 `O(1)` 时间复杂度的主题切换应用，同时完美保证了 Iframe 运行时的样式纯净。

## 4. 核心状态与数据流转中枢 (Core State & Data Flow Engine)
* **关联路径**：`packages/editor/src/editor/stores/` (含 `components.tsx`, `historyStore.ts`)
* **职责**：作为低代码平台的大脑，负责接管整个 JSON Schema（AST树）的单向数据流。
- **架构价值**：依赖 Zustand + Immer 进行不可变数据（Immutable）更新，将页面上所有零散的交互逻辑收敛。内部封装历史快照栈（History Stack），用极低的内存开销实现了高频拖拽/配置操作下的微小切片级“撤销与重做”业务。

## 5. 可视化拖拽编排引擎 (Visual Drag-and-Drop Editor)
* **关联路径**：`packages/editor/src/editor/components/EditArea/` 及 `packages/editor/src/renderer/`
* **职责**：提供所见即所得的中心画布交互，接管从物料区（面板）到画布区（Iframe视图）的拖拽通信。
- **架构价值**：依托 `React-DND` 和 `@dnd-kit`，处理跨容器拖拽上下文。设计并攻克了拖拽指示器（Drop Indicator）、嵌套层级检测、光标高亮遮罩（Hover/Selected Mask）等复杂的空间几何坐标计算难题。

## 6. 动态属性配置器 (Dynamic Property Configurator)
* **关联路径**：`packages/editor/src/editor/components/Setting/` (基于 Schema Setter 驱动)
* **职责**：作为右侧的中控面板，扮演驱动“协议驱动UI”的关键角色。
- **架构价值**：动态监听画布的 Node 焦点，并读取底层 `@lowcode/schema` 中的 Setter 描述器配置。根据不同的 setter 关键字（如 'select', 'json-editor'）渲染出相应的配置表单组件，实现数据、样式与自定义交互事件的双向绑定与闭环下发。

## 7. `@lowcode/renderer` - 纯净状态域的渲染机器 (Pure Render Engine)
* **关联路径**：`packages/renderer/src/index.tsx` (独立的 Renderer 纯逻辑)
* **职责**：一个绝对无副作用的纯 React 函数系统。入参是 JSON Schema Tree，输出是 React 虚拟 DOM 树。
- **架构价值**：完全不懂拖拽，也不和 Editor 通信，这就意味着它既可以在被组装到 Iframe 沙盒里当预览器，也可以直接 npm install 到 C 端项目中实现**编排态与运行态 100% 同构渲染**，甚至是跨框架（Vue Renderer）的基建。

## 8. Iframe Sandbox Host - 沙盒调度与通信中枢 (Sandbox Bridge)
*   **关联路径**：`packages/editor/src/renderer/` 与主应用 `packages/editor/src/editor/components/Preview/` 的 iframe 桥接
*   **职责**：在主应用中嵌入 Renderer 的壳子环境（由于架构演进中，当前采用 `sandboxExecutor` 与 PostMessage）。
- **架构价值**：采用跨 Window 的 `postMessage` 机制与拖拽上下文 (`DndProvider`) 注入，隔离了低代码画布编辑态（Drag&Drop）与运行态的界限。既阻断了用户自定义污染 CSS、脚本造成的编辑器崩溃（隔离故障域），又保障了高度定制的可视化效果。

## 9. `@lowcode/editor` - 可视化编排与状态流转大脑 (Orchestration Engine)
*   **关联路径**：`packages/editor/src/editor/index.tsx` (编辑器主入口挂载)
*   **职责**：应用层的拼装枢纽，将上述所有的引擎、面板和通信机制组装成一个开箱即用的 Web 级产品。
- **架构价值**：负责统筹左侧物料生态、中间 Iframe 交互画布、右侧动态配置器，以及顶部的历史记录仪，打造了“即看即所得”的高阶生产力体验。

## 10. `@lowcode/code-generator` - 多目标构建与出码流水线 (Code Generation Pipeline)
*   **关联路径**：`packages/code-generator/src/` (含核心 `project-builder.ts` 与各种模板/插件)
*   **职责**：独立的 Node.js / Browser 兼容构建产物机。
- **架构价值**：利用 AST（抽象语法树）拼装能力，采用了可插拔的设计模式。接收 JSON Schema 和渲染器配置，将其编译打包成完整的 React+Vite 标准化中后台源码工程包。支持从“黑箱产品”一键弹出为“本地可二次开发源码”的功能生命周期。
