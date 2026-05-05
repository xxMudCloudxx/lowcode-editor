# 🏗️ 低代码编辑器架构重构计划 (详细执行版)

> **版本核心**: 本文档包含了具体的代码级执行步骤、目标目录结构和接口定义。

## 总览：五个 Branch 的依赖关系

```
refactor/monorepo-foundation (Branch 1)           ← ✅ 已完成
    ├── refactor/renderer-unification (Branch 1.5) ← 🆕 激活 @lowcode/renderer，统一渲染引擎
    │   └── refactor/iframe-preview (Branch 2)     ← 预览模式也走 iframe 隔离
    ├── refactor/codegen-decoupling (Branch 3)     ← 依赖 Branch 1 的 monorepo 结构
    └── refactor/collab-crdt (Branch 4)            ← 依赖 Branch 1 的 schema 包
```

---

## Branch 1: `refactor/monorepo-foundation`

### 目标

将当前单体项目拆分为 **Monorepo 多包架构**，建立清晰的模块边界。

### 最终目录结构

```
lowcode-editor/
├── packages/
│   ├── schema/          ← 🆕 协议层：所有 TypeScript 接口和类型
│   ├── renderer/        ← 🆕 渲染器：纯粹的 Schema → React 渲染
│   ├── materials/       ← 🆕 物料库：所有组件的 meta + 实现
│   ├── code-generator/  ← 🔄 已有代码迁移，独立为包
│   └── editor/          ← 🔄 设计器主应用（瘦身后）
├── pnpm-workspace.yaml
├── package.json         ← 根 package.json (workspace 配置)
└── tsconfig.json        ← 根 tsconfig (paths / references)
```

### 详细步骤

**Step 1.1：初始化 pnpm workspace**

- 在根目录创建 `pnpm-workspace.yaml`：
  ```yaml
  packages:
    - "packages/*"
  ```
- 根 `package.json` 改为 `private: true`，移除直接依赖，只保留 devDependencies（eslint, prettier, typescript 等）。
- 创建根 `tsconfig.json`，使用 `references` 指向各子包。

**Step 1.2：抽取 `@lowcode/schema` 包**

这是整个重构最关键的一步。把**协议/类型**从代码中剥离出来，成为所有包的共享依赖。

从以下文件中提取类型：

| 源文件                                   | 提取内容                                                                | 目标位置                           |
| :--------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------- |
| `src/editor/interface.ts`                | `Component`, `ComponentTree`                                            | `packages/schema/src/component.ts` |
| `src/editor/types/component-protocol.ts` | `ComponentProtocol`, `SetterConfig`, `EventConfig`, `EditorBehavior` 等 | `packages/schema/src/protocol.ts`  |
| `src/code-generator/types/ir.ts`         | `ISchema`, `ISchemaNode`, `IRNode`, `IRProject` 等全部 IR 类型          | `packages/schema/src/ir.ts`        |
| `src/code-generator/types/plugin.ts`     | `IComponentPlugin`, `IProjectPlugin`, `IPostProcessor`                  | `packages/schema/src/plugin.ts`    |

- 这个包 **零运行时依赖**，只导出 TypeScript 类型和少量常量。
- 发布为 `@lowcode/schema`。

**Step 1.3：抽取 `@lowcode/materials` 包**

- 将 `src/editor/materials/` 整个目录移动到 `packages/materials/src/`。
- 包括所有子目录：`General/`, `Layout/`, `DataEntry/`, `DataDisplay/`, `Navigation/`, `Feedback/`, `Page/`。
- `_generated/` 目录和生成脚本 (`scripts/gen-antd-metas.ts`) 也迁移到此包。
- 此包依赖 `@lowcode/schema`（使用 `ComponentProtocol` 类型）。
- 此包导出:
  ```typescript
  // packages/materials/src/index.ts
  export { materials } from "./registry"; // 注册后的完整物料列表
  export type { ComponentConfig } from "@lowcode/schema";
  ```

**Step 1.4：抽取 `@lowcode/renderer` 包**

这是摆脱"玩具感"的核心步骤。

- 创建 `packages/renderer/`。
- 从 `src/editor/components/Preview/index.tsx` 中提取渲染逻辑，但**严禁引用任何 store**。
- Renderer 的 API 设计：

  ```typescript
  // packages/renderer/src/Renderer.tsx
  export interface RendererProps {
    /** JSON Schema —— 组件树的标准描述 */
    schema: ISchemaNode[];
    /** 组件注册表 —— name → React Component 的映射 */
    components: Record<string, ComponentConfig>;
    /** 事件处理回调 */
    onEvent?: (componentId: number, eventName: string, args: unknown[]) => void;
  }

  export function Renderer({ schema, components, onEvent }: RendererProps) {
    // 纯粹的递归渲染，不依赖任何 store
  }
  ```

- 当前 `Preview` 组件改为 **Renderer 的消费者**，负责从 store 取数据，转换为 `RendererProps` 传入。

**Step 1.5：迁移 `@lowcode/code-generator` 包**

- 将 `src/code-generator/` 整个目录移动到 `packages/code-generator/`。
- 此包依赖 `@lowcode/schema`。
- 入口函数签名不变（`exportSourceCode(schema, options)`）。
- 清理对编辑器 store 的引用（目前应该没有，但需要确认）。

**Step 1.6：瘦身 `@lowcode/editor` 主应用**

- `packages/editor/` 保留：
  - `stores/`（components, ui, collaboration, history）
  - `components/`（EditArea, Header, Setting, MaterialWrapper, CodePreviewDrawer）
  - `hooks/`
- 所有类型引用改为 `import type { ... } from '@lowcode/schema'`。
- 所有物料引用改为 `import { materials } from '@lowcode/materials'`。
- Preview 组件改为使用 `import { Renderer } from '@lowcode/renderer'`。
- 出码引用改为 `import { exportSourceCode } from '@lowcode/code-generator'`。

**Step 1.7：验证**

- 运行 `pnpm dev` 确保编辑器正常启动。
- 运行 `pnpm test` 确保所有现有测试通过。
- 单独构建每个包，验证没有循环依赖。

---

## Branch 1.5: `refactor/renderer-unification` 🆕

> **参考**: 阿里巴巴 lowcode-engine 的分层思路（渲染核心统一、设计态能力通过注入点扩展）

### 背景：当前问题

当前 `@lowcode/renderer` 包尚未被业务路径消费，编辑态与预览态分别维护了两套递归渲染逻辑。

| 场景         | 实现位置                                                       | 渲染方式                                     |
| ------------ | -------------------------------------------------------------- | -------------------------------------------- |
| 编辑模式画布 | `packages/editor/src/renderer/components/RendererEditArea.tsx` | iframe 内渲染，通过 postMessage 与 Host 通信 |
| 预览模式     | `packages/editor/src/editor/components/Preview/index.tsx`      | Host 窗口直接渲染，无样式隔离                |

### 目标

将 `@lowcode/renderer` 变成唯一渲染核心，遵循 lowcode-engine 的关键原则：

1. **同一渲染核心服务 design/live 两种模式**（不是两套 renderer）
2. **设计态能力通过注入点扩展**（如 `customCreateElement` / `onCompGetRef`）
3. **编辑器专有能力不下沉到 renderer 包**（拖拽、蒙层、事件编排由 editor 维护）

### 最终架构（贴合当前项目）

```
@lowcode/renderer
  ├─ SchemaRenderer（纯渲染核心）
  ├─ types（RendererProps / DesignHooks / RenderContext）
  └─ utils（可选：props 解析、condition/loop 等）

@lowcode/editor
  ├─ renderer/RendererEditArea  → SchemaRenderer(design)
  │                              + DragWrapper + HoverMask + SelectedMask
  └─ editor/components/Preview  → SchemaRenderer(live)
                                 + EventOrchestrator（仍在 editor 包）
```

### 详细步骤

**Step 1.5.0：冻结渲染输入契约（先做）**

统一输入模型为：`components + rootId + componentMap`（范式化 Map），不再混用树结构输入。

```typescript
export interface SchemaRendererProps {
  components: Record<number, Component>;
  rootId: number;
  componentMap: Record<string, ComponentConfig>;
  designMode?: "design" | "live";
  designHooks?: {
    onCompGetRef?: (id: number, el: HTMLElement | null) => void;
    customCreateElement?: (
      componentId: number,
      componentName: string,
      element: React.ReactElement,
    ) => React.ReactElement;
  };
  onEvent?: (componentId: number, eventName: string, args: unknown[]) => void;
}
```

**Step 1.5.1：实现 SchemaRenderer 核心（renderer 包）**

- 只实现纯渲染能力：组件查找、props 合并、children 递归、Suspense 包裹
- `designMode="live"` 时优先 `runtimeComponent`
- `designMode="design"` 时支持注入 `data-component-id` 与 ref 收集

**Step 1.5.2：明确能力边界（对齐阿里分层）**

保留在 `@lowcode/editor`：

- 拖拽排序（`RendererDraggableNode`）
- Hover/Selected 蒙层
- 事件编排（`goToLink` / `showMessage` / `customJs` / `componentMethod`）

保留在 `@lowcode/renderer`：

- 纯渲染管道与模式切换
- 设计态注入点（hook/回调），不依赖 store

**Step 1.5.3：替换编辑态渲染路径**

将 `RendererEditArea.RenderNode` 替换为 `SchemaRenderer(design)`；通过 `customCreateElement` 注入 DragWrapper；保留现有鼠标捕获与 postMessage 交互链路。

**Step 1.5.4：替换预览态渲染路径**

将 `Preview.RenderNode` 替换为 `SchemaRenderer(live)`；`EventOrchestrator` 迁到 editor 内独立模块（不放 renderer 包）。

**Step 1.5.5：兼容层与灰度开关**

新增特性开关（例如 `renderer.unified=true/false`），允许旧渲染路径与新路径并存 1 个迭代，支持快速回滚。

**Step 1.5.6：验证**

- [ ] `pnpm build` 全包通过
- [ ] 编辑态拖拽、选中、悬停行为不回归
- [ ] 预览态事件编排与旧版一致
- [ ] 关键链路仍有 `data-component-id`，蒙层定位正常
- [ ] `@lowcode/renderer` 无 editor/store 依赖

### 预估

- **工期**: 3-4 天
- **风险**: 中（替换两条渲染路径）
- **收益**: 去重、后续功能扩展成本显著下降

---

## Branch 2: `refactor/iframe-preview` (更新)

### 目标

将预览模式迁入 iframe，形成编辑/预览统一隔离环境，提升所见即所得一致性。

### 前置依赖

Branch 1.5 完成（统一渲染核心已落地并灰度验证）。

### 设计取舍（参考阿里方案）

- 阿里在同域下可用共享引用通信（`window.LCSimulatorHost`）提升效率
- 当前项目已稳定使用 postMessage，且边界更清晰
- **本阶段保持 postMessage，不切通信机制**，优先完成预览 iframe 化

### 详细步骤

**Step 2.1：统一 iframe 入口，支持 edit/preview 双模式**

`RendererApp` 根据 `mode` 渲染 `RendererEditArea` 或 `RendererPreviewArea`，两者都复用 `SchemaRenderer`。

**Step 2.2：新增 RendererPreviewArea（iframe 内）**

- 使用 `SchemaRenderer(designMode="live")`
- 复用 editor 侧 EventOrchestrator（通过消息或上下文注入）
- 不引入第二套渲染实现

**Step 2.3：协议策略（先复用、后扩展）**

优先复用现有 `SYNC_UI_STATE` 的 `mode` 同步能力。

仅当需要“瞬时命令语义”时，再新增 `SWITCH_MODE`，避免协议膨胀。

**Step 2.4：两阶段退役旧 Preview**

1. 阶段 A（灰度）：保留旧 Preview，使用开关 `preview.useIframe`
2. 阶段 B（收口）：灰度稳定后删除旧 Preview 组件与旧入口分支

**Step 2.5：响应式预览**

继续使用 `canvasSize` 驱动 iframe 尺寸，统一编辑/预览设备视图能力。

**Step 2.6：迁移安全与回滚策略**

- 增加监控指标：模式切换耗时、消息失败率、渲染异常率
- 保留快速回滚：`preview.useIframe=false` 立即回退旧链路
- 明确兼容窗口：至少 1 个小版本并行保留

**Step 2.7：验证**

- [ ] 编辑模式功能不受影响
- [ ] 预览模式在 iframe 内正确渲染且无样式污染
- [ ] edit/preview 切换稳定，无明显卡顿
- [ ] 事件编排与旧 Preview 行为一致
- [ ] 连续切换与长时会话无明显内存泄漏

### 预估

- **工期**: 3-4 天
- **风险**: 中高（跨 iframe 事件与模式切换）
- **收益**: 一致性提升、架构收敛、维护成本下降

---

## Branch 3: `refactor/codegen-decoupling`

### 目标

将出码系统从"只能生成 React+Vite"升级为**可插拔的、支持多目标的出码架构**。

### 前置依赖

Branch 1 完成（`@lowcode/code-generator` 已独立为包）。

### 详细步骤

**Step 3.1：标准化 Solution 接口**

目前 `react-vite.ts` 是唯一的 Solution，且内部硬编码了插件顺序。需要重构为：

```typescript
// packages/code-generator/src/types/solution.ts
export interface ISolution {
  name: string;
  description: string;
  /** 框架模板（决定生成什么脚手架文件） */
  template: IProjectTemplate;
  /** 组件级插件流水线 */
  componentPlugins: IComponentPlugin[];
  /** 项目级插件流水线 */
  projectPlugins: IProjectPlugin[];
  /** 后处理器 */
  postProcessors: IPostProcessor[];
  /** 发布器 */
  publisher: IPublisher;
}
```

**Step 3.2：抽取 Publisher 接口**

当前 `zipPublisher` 是直接调用的，需要抽象：

```typescript
// packages/code-generator/src/types/publisher.ts
export interface IPublisher {
  name: string;
  publish(
    files: IGeneratedFile[],
    options: Record<string, any>,
  ): Promise<IPublishResult>;
}

export interface IPublishResult {
  type: "blob" | "files" | "url";
  blob?: Blob;
  files?: IGeneratedFile[];
  url?: string;
}
```

- 实现 `ZipPublisher`（已有）。
- 新增 `CodeSandboxPublisher`（利用已有的 `codesandbox-import-utils` 依赖，打开在线预览）。

**Step 3.3：重构插件注册机制**

当前插件是在 `react-vite.ts` 中硬编码导入的。改为注册式：

```typescript
// packages/code-generator/src/registry.ts
class PluginRegistry {
  private componentPlugins: Map<string, IComponentPlugin> = new Map();
  private projectPlugins: Map<string, IProjectPlugin> = new Map();

  registerComponentPlugin(plugin: IComponentPlugin) { ... }
  registerProjectPlugin(plugin: IProjectPlugin) { ... }
  getComponentPlugins(): IComponentPlugin[] { ... }
  getProjectPlugins(): IProjectPlugin[] { ... }
}
```

**Step 3.4：增强 SchemaParser 的容错性**

当前 `SchemaParser` 对异常 Schema 的处理较简单。增加：

- 未知组件名的 fallback（生成注释 `{/* Unknown: XYZ */}`）。
- 循环引用检测。
- Schema 版本校验。

**Step 3.5：为 Vue 出码预留扩展点**

不需要立即实现 Vue 出码，但架构上要留好位置：

```
packages/code-generator/src/
├── solutions/
│   ├── react-vite.ts      ← 现有
│   └── vue-vite.ts         ← 未来
├── plugins/
│   ├── component/
│   │   ├── react/          ← 现有 JSX 插件
│   │   │   └── jsx.ts
│   │   ├── vue/            ← 未来 SFC 插件
│   │   └── style/
│   │       └── css.ts      ← 现有
│   └── project/
│       ├── react/          ← React 项目级插件
│       └── vue/            ← 未来
```

**Step 3.6：增加出码集成测试**

- 准备 3-5 个典型的 Schema fixture（简单表单、带布局的列表页、含 Modal 的交互页）。
- 对每个 fixture 运行出码，断言生成的文件列表和内容快照 (snapshot test)。

**Step 3.7：验证**

- 所有现有出码测试通过。
- 新增的 CodeSandbox 发布器能成功打开在线预览。
- 注册一个空的 Vue Solution 不会报错（证明扩展点可用）。

---

## Branch 4: `refactor/collab-crdt`

### 目标

将协同编辑从**朴素 JSON Patch 全量同步**升级为基于 **Yjs (CRDT)** 的无冲突实时协同。

### 详细步骤

**Step 4.1：安装 Yjs 生态**

```bash
pnpm add yjs y-websocket y-protocols
pnpm add -D @types/yjs
```

**Step 4.2：设计 Yjs Document 结构**

将当前的 `Record<number, Component>` 映射到 Yjs 的共享数据类型：

```typescript
// packages/editor/src/stores/yjs/schema.ts
import * as Y from "yjs";

/**
 * Yjs Document 结构：
 *
 * doc.getMap('components')    → Y.Map<string, Y.Map>   每个组件是一个 Y.Map
 *   ├── "1" → Y.Map { id, name, desc, props: Y.Map, styles: Y.Map, children: Y.Array, parentId }
 *   └── ...
 */
export function createYjsDocument(): Y.Doc {
  return new Y.Doc();
}

export function componentsToYjs(
  doc: Y.Doc,
  components: Record<number, Component>,
) {
  const yComponents = doc.getMap("components");
  // ...转换逻辑
}
```

**Step 4.3：创建 YjsAdapter**

这是连接 Zustand Store 和 Yjs Document 的桥梁。

**Step 4.4：替换现有 WebSocket 逻辑**

主要影响 `hooks/useCollaboration.ts` 和 `undoMiddleware.ts`。

**Step 4.5：Awareness 适配（光标 + 选中）**

使用 `y-websocket` 的 `awareness` 实现光标跟随。

**Step 4.6：后端适配**

后端需要支持 Yjs 同步协议（或通过 WebSocket 代理逻辑）。

---

## 执行建议

1. **Monorepo Foundation** (Branch 1): ✅ 已完成
2. **Renderer 统一** (Branch 1.5): 3-4 天 (⭐⭐ 中) ← **建议下一步**
3. **Iframe Preview** (Branch 2): 3-4 天 (⭐⭐⭐ 高，依赖 1.5)
4. **CodeGen Decoupling** (Branch 3): 2-3 天 (⭐ 低)
5. **Collab CRDT** (Branch 4): 7-10 天 (⭐⭐⭐ 高)
