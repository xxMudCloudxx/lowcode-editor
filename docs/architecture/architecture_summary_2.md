# 企业级低代码平台前端架构分解

> 面向大厂简历与面试的深度技术拆解。本文档基于当前 monorepo 代码实际状态撰写。

本项目采用 **pnpm Monorepo 多包架构**，5 个独立 npm 包通过明确的依赖关系组合成完整的低代码平台。整体架构自底向上分为 **10 个核心模块**。

---

## 依赖拓扑

```
@lowcode/schema          ← 基础协议层（无依赖）
    ↑
@lowcode/materials       ← 物料库（依赖 schema）
    ↑
@lowcode/renderer        ← 渲染引擎（依赖 schema + materials）
    ↑
@lowcode/code-generator  ← 出码流水线（依赖 schema）
    ↑
@lowcode/editor          ← 编辑器主应用（依赖全部）
```

---

## 1. `@lowcode/schema` — 全局规范与防腐层

**路径：** `packages/schema/src/`

**核心类型：**
- `Component` — 范式化节点（`children` 仅存 id 数组，真实数据存 Map）
- `ComponentTree` — 树状嵌套版本（用于剪切板、出码递归）
- `ComponentProtocol` — 物料行为协议（`isContainer`、`parentTypes`、`interactiveInEditor`、`dragPreview`）
- `SetterConfig / EventConfig / MethodConfig` — 配置面板描述符

**架构价值：** 系统的"法律"。所有物料、渲染引擎、出码流水线只认 Schema 接口，从物理层面斩断包间隐式耦合。`Component` 采用范式化（Normalized）存储而非嵌套树，使任意节点的增删改查均为 O(1)，避免了深层嵌套树的递归遍历开销。

---

## 2. `@lowcode/materials` — 泛生态物料工厂

**路径：** `packages/materials/src/`

**物料分类（34 个组件）：**

| 分类 | 组件 |
|------|------|
| General | Button、Icon、Typography |
| Layout | Container、Grid、GridColumn、Space |
| Navigation | Breadcrumb、Dropdown、Menu、PageHeader、Pagination、Steps、TabPane |
| DataEntry | Input、Radio、Select、Slider、Switch、Upload |
| DataDisplay | Avatar、Card、Image、List、ListItem、TableColumn、Tooltip |
| Feedback | Modal |
| Page | Root 页面组件 |

**核心机制：**

- **dev/prod 分离**：每个物料包含 `dev.tsx`（编辑态，含拖拽锚点）和 `prod.tsx`（运行态，纯业务逻辑），彻底解耦编辑器逻辑与业务逻辑。
- **自动化注册**：`index.tsx` 使用 `import.meta.glob` 扫描所有 `meta.tsx`，新增物料无需修改任何注册代码。
- **反向注册拖放**：子物料通过 `parentTypes` 声明可被哪些容器接受，容器的 `useDrop` 动态识别合法子物料，实现高度解耦。
- **antd 元数据自动生成**：`gen:meta` 脚本通过 `react-docgen-typescript` 解析 antd 组件 Props，自动生成 `meta.tsx` 配置文件。

**架构价值：** 实现了"编辑器与组件库的解耦"，未来可拔插任意第三方 npm 物料包。

---

## 3. UI 主题渲染系统 — Antd 双令牌分层架构

**路径：** `packages/editor/src/theme/`（`antdTheme.ts`、`tokens.ts`）

**双令牌体系：**
- **Global Token（全局令牌）**：用户在全局设置面板修改 Seed Token（主色、圆角），系统利用 antd v5 算法自动推导整套渐变色板，实时应用到整个搭建产物。
- **Component Token（组件级令牌）**：在单个组件的样式面板中直接覆写局部 Component Token，精准控制单个组件样式。

**架构价值：** 彻底摒弃传统低代码平台注入海量冗余 CSS 字符串、依赖强覆盖选择器的弊端。利用 antd v5 CSS-in-JS 特性，实现 O(1) 时间复杂度的主题切换，同时保证 iframe 运行时的样式纯净。

---

## 4. 核心状态与数据流转中枢

**路径：** `packages/editor/src/editor/stores/`

项目将状态拆分为三个职责明确的 Zustand Store：

### `useComponentsStore` — 组件树 Master Store

```ts
// 中间件组合：immer（不可变更新）+ persist（localStorage 持久化）
create<EditorStore>()(persist(immer(creator), { name: "lowcode-store" }))
```

- 范式化存储：`components: Record<number, Component>`，O(1) 节点访问
- 通过自定义 `undoMiddleware` 在每次 `setState` 时自动产出 Immer patches，发布到 `patchEventBus`
- 版本号 `version` 随每次变更自增，用于 iframe 侧的补丁版本校验

### `useHistoryStore` — 增量补丁历史 Store

- 存储 `PatchGroup[]`（正向 patches + 逆向 inversePatches），最多保留 50 步
- `undo/redo` 通过 `applyPatches` 直接操作 componentsStore，并将产生的补丁广播到 iframe
- `isApplyingPatches` 标志位防止 undo/redo 操作被再次记录进历史栈
- `applyRemotePatch()` 预留了实时协同编辑接口：远程补丁不进入本地撤销栈

### `useUIStore` — 瞬时 UI 状态 Store

- 管理：当前选中组件 id、编辑/预览模式、画布尺寸预设（mobile 375px / tablet 768px / desktop 100%）、剪切板
- 仅使用 immer 中间件，不接入 temporal 或 persist，避免 UI 状态污染历史栈或 localStorage

**架构价值：** 三 Store 分离策略将"需要持久化的业务数据"、"需要撤销的操作历史"、"不需要持久化的 UI 状态"彻底隔离，避免了单一大 Store 的状态污染问题。

---

## 5. Simulator 沙盒通信系统 — 增量补丁同步协议

**路径：** `packages/editor/src/editor/simulator/`

这是本项目最复杂的工程模块，实现了 Host（主应用）与 Renderer（iframe）之间的高可靠双向通信。

### 架构模型

```
Host（主应用）                    Iframe（Renderer）
useComponentsStore ──patch──→ patchEventBus
                                    ↓
SimulatorHost ──postMessage──→ SimulatorRenderer
                                    ↓
                              Slave Store（只读副本）
                                    ↓
                              SchemaRenderer（渲染）

Iframe 交互事件 ──postMessage──→ SimulatorHost
                                    ↓
                              useComponentsStore（写操作）
```

**设计原则：Host 是 Store 的唯一 Master，Iframe 持有只读 Slave Replica，所有写操作通过 `DISPATCH_ACTION` 委托给 Host。**

### 通信协议（MessageType 枚举）

| 方向 | 消息类型 | 说明 |
|------|----------|------|
| Iframe → Host | `READY` | 握手，触发全量快照下发 |
| Host → Iframe | `SYNC_COMPONENTS_STATE` | 全量快照（附版本号） |
| Host → Iframe | `SYNC_COMPONENTS_STATE_CHUNK` | 大组件树分片传输 |
| Host → Iframe | `SYNC_COMPONENTS_PATCH` | 增量补丁（附 baseVersion） |
| Host → Iframe | `SYNC_UI_STATE` | UI 状态全量同步 |
| Host → Iframe | `SYNC_COMPONENT_CONFIG` | 物料配置（初始化一次） |
| Host → Iframe | `DRAG_START_METADATA / DRAG_END` | 拖拽旁路通信 |
| Iframe → Host | `DISPATCH_ACTION` | 委托执行 Store Action |
| Iframe → Host | `REQUEST_FULL_SNAPSHOT` | 版本断层自愈请求 |
| Iframe → Host | `SELECT_COMPONENT / HOVER_COMPONENT` | 交互事件上报 |
| Iframe → Host | `FORWARD_KEYBOARD_EVENT` | 键盘事件转发 |

### 关键工程细节

**增量补丁流（核心优化）：**
- 组件状态同步从全量 subscribe 改为增量 Immer patches，高频拖拽时消息体积降低 90%+
- `patchEventBus` 解耦 Store 与 SimulatorHost，避免直接订阅

**微任务级补丁批处理：**
- 同一微任务内的多个 patches 合并为一次 postMessage，避免高频操作时的消息风暴
- 拖拽期间自动切换为 `requestAnimationFrame` 刷新策略，拖拽结束恢复微任务级

**WAL 环形缓冲（L5 自愈机制）：**
- Host 维护容量为 50 的 WAL（Write-Ahead Log）环形缓冲，存储最近 50 个 patch
- Iframe 检测到版本断层时发送 `REQUEST_FULL_SNAPSHOT`，携带本地 `localVersion`
- Host 优先尝试从 WAL 回放缺失 patches（避免全量重建），仅在 WAL 无法覆盖时才下发全量快照
- 开发环境暴露 `__LOWCODE_WAL__` 调试 API（stats / simulateGap / reset）

**分片传输：**
- 大组件树按 100 个节点一片拆分传输，避免序列化阻塞主线程
- 每次传输携带唯一 `transferId`，Renderer 侧按序拼装，超时 3s 触发全量重建降级

**架构价值：** 这套协议将 iframe 隔离的故障域优势（CSS/JS 污染隔离）与高性能增量同步结合，同时通过 WAL 自愈机制保证了在网络抖动或版本断层场景下的最终一致性。

---

## 6. 可视化拖拽编排引擎

**路径：** `packages/editor/src/editor/components/` + `packages/renderer/src/`

- 基于 `React-DND` 实现跨容器拖拽，`DndProvider` 同时注入主应用和 iframe
- 拖拽开始时通过 `DRAG_START_METADATA` 消息将物料元数据旁路传递给 iframe，解决跨 window DnD 上下文隔离问题
- 选中遮罩（Selected Mask）和悬浮提示（Hover Mask）通过 `data-component-id` 属性定位 DOM，计算绝对坐标覆盖
- 组件大纲树支持拖拽排序，与画布拖拽共享同一套 Store Action

---

## 7. 动态属性配置器

**路径：** `packages/editor/src/editor/components/Setting/`

- 右侧面板分三栏：**属性（Props）**、**样式（Styles）**、**事件（Events）**
- 属性面板：读取物料 `meta.tsx` 中的 `SetterConfig` 描述符，按 setter 类型（`select`、`json-editor`、`input` 等）动态渲染对应表单组件
- 样式面板：细分为 Layout（尺寸/盒模型）、Location（定位）、Front（字体）、Board（边框/圆角/阴影）、Background、Other 六个子面板，每个子面板对应一组 CSS 属性
- 事件面板：支持为组件事件绑定多种 Action（调用其他组件方法、弹出消息、跳转链接、执行自定义 JS）
- 面包屑导航：面板顶部展示当前选中组件的父子层级，支持点击快速切换选中目标

---

## 8. `@lowcode/renderer` — 纯净渲染引擎

**路径：** `packages/renderer/src/`

**核心导出：** `SchemaRenderer` 组件

- 入参：JSON Schema Tree + `designMode` 标志 + `DesignHooks`（悬浮/选中回调）
- 输出：React 虚拟 DOM 树
- 零副作用：不感知拖拽，不与 Editor 通信，不持有任何全局状态
- `designMode=true` 时注入 `data-component-id` 属性，供遮罩层定位
- 同时服务于：iframe 设计态画布、预览模式、未来可能的 C 端运行时

**架构价值：** 编排态与运行态 100% 同构渲染，消除了"预览效果与实际效果不一致"的问题。

---

## 9. Sandbox 安全执行器

**路径：** `packages/editor/src/editor/utils/sandboxExecutor.ts`

用于安全执行用户在事件面板中编写的自定义 JavaScript 代码：

- 动态创建隐藏 iframe，设置 `sandbox="allow-scripts"` 属性，禁止访问父页面 DOM
- 用户代码通过 `JSON.stringify` 转为字符串字面量后注入，防止模板字符串注入攻击
- 通过 `postMessage` 与主页面通信（`showMessage` / `complete` / `error`）
- 5s 超时自动清理，执行完毕后销毁 iframe

---

## 10. `@lowcode/code-generator` — 多目标出码流水线

**路径：** `packages/code-generator/src/`

参考 `alibaba/lowcode-engine` 的 Pipeline 架构，将 Schema 转换为完整可运行的前端工程：

```
Schema
  ↓ Parser（schema-parser.ts）
IR（中间表示，解耦 Schema 与代码生成）
  ↓ Solution（react-vite.ts / vue-vite.ts）
  ↓ Preprocessor（状态提升，支持组件联动）
  ↓ Component Plugins（jsx.ts → .tsx，css.ts → .module.scss）
  ↓ Project Plugins（package.json、vite.config.ts、index.html、路由）
  ↓ Postprocessor（prettier 格式化）
  ↓ Publisher（zip-publisher.ts → JSZip → 浏览器下载）
完整 React + Vite 工程包（.zip）
```

**关键设计：**
- IR（Intermediate Representation）层解耦了上层 Schema 与下层代码生成逻辑，新增出码目标只需实现新 Solution
- 插件系统分两级：Component Plugin（操作单个 IRNode）和 Project Plugin（操作整个 ProjectBuilder）
- `ModuleBuilder` 智能处理 import 去重、React Hooks 生成、事件处理函数（Actions）生成
- 支持 React+Vite 和 Vue+Vite 两套 Solution，可通过插件注册扩展

---

## 测试覆盖

| 文件 | 测试框架 | 覆盖内容 |
|------|----------|----------|
| `stores/history.test.ts` | Vitest + Testing Library | historyStore 单元测试 + 与 componentsStore 集成测试 |
| `stores/components.test.tsx` | Vitest + Testing Library | componentsStore 增删改查 |
| `simulator/SimulatorRenderer.test.ts` | Vitest | SimulatorRenderer 通信逻辑 |
| `code-generator/` | Vitest | 出码流水线各阶段 |

---

## 架构演进记录

| 版本 | 变更 |
|------|------|
| v1 | 单包应用，`src/` 平铺结构 |
| v2 | 重构为 pnpm Monorepo，拆分 5 个独立包 |
| v2.1 | SimulatorHost 从全量 subscribe 改为增量补丁流 |
| v2.2 | 新增 WAL 环形缓冲 + 分片传输 + 版本断层自愈 |
| v2.3 | historyStore 从 Zustand temporal 中间件改为自定义 Immer patch 方案，支持协同编辑预留接口 |
