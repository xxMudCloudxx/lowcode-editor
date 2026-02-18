# 🏗️ 低代码编辑器架构重构计划 (详细执行版)

> **版本核心**: 本文档包含了具体的代码级执行步骤、目标目录结构和接口定义。

## 总览：四个 Branch 的依赖关系

```
refactor/monorepo-foundation (Branch 1)
    └── refactor/iframe-preview (Branch 2)  ← 依赖 Branch 1 拆出的 renderer 包
        └── refactor/codegen-decoupling (Branch 3)  ← 依赖 Branch 1 的 monorepo 结构
            └── refactor/collab-crdt (Branch 4)  ← 依赖 Branch 1 的 schema 包
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

## Branch 2: `refactor/iframe-preview`

### 目标

用 **iframe 沙箱** 替换当前的同页面预览，实现彻底的样式和环境隔离。

### 前置依赖

Branch 1 完成（`@lowcode/renderer` 包已抽离）。

### 详细步骤

**Step 2.1：创建 Renderer Host 页面**

- 在 `packages/renderer/` 中新增一个独立的 HTML 入口：`packages/renderer/src/host.tsx`。
- 这是一个极简的 React 应用，功能是：
  1. 监听 `window.addEventListener('message', ...)` 接收来自父窗口的 Schema 数据。
  2. 用 `<Renderer>` 组件渲染收到的 Schema。
  3. 将用户交互事件通过 `parent.postMessage(...)` 回传给编辑器。
- Vite 配置为独立打包，产物是一个可独立加载的 HTML 页面。

**Step 2.2：设计 PostMessage 通信协议**

```typescript
// packages/schema/src/iframe-protocol.ts

/** 编辑器 → iframe */
export type EditorToRendererMessage =
  | { type: "RENDER"; payload: { schema: ISchemaNode[]; components: string[] } }
  | { type: "UPDATE_PROPS"; payload: { componentId: number; props: any } }
  | { type: "SELECT"; payload: { componentId: number | null } }
  | { type: "HOVER"; payload: { componentId: number | null } };

/** iframe → 编辑器 */
export type RendererToEditorMessage =
  | { type: "COMPONENT_CLICK"; payload: { componentId: number } }
  | { type: "COMPONENT_HOVER"; payload: { componentId: number } }
  | {
      type: "EVENT_FIRED";
      payload: { componentId: number; eventName: string; args: unknown[] };
    }
  | { type: "RENDERER_READY" }
  | { type: "DOM_RECT"; payload: { componentId: number; rect: DOMRect } };
```

**Step 2.3：改造 EditArea 画布区**

- 当前 `EditArea` 中直接渲染组件的逻辑，替换为嵌入一个 `<iframe>`。
- 创建 `useIframeBridge` Hook：
  - 负责向 iframe 发送 Schema 更新。
  - 负责接收 iframe 中的点击/悬停事件，同步到 `uiStore.setCurComponentId`。
  - 当 store 中 `components` 发生变化时，自动 `postMessage` 新的 Schema 给 iframe。
- 选中遮罩 (SelectedMask) 改为基于 iframe 内回传的 `DOMRect` 定位，叠加在 iframe 之上（使用 `pointer-events: none` 的绝对定位层）。

**Step 2.4：拖拽适配**

- 当前使用的 `@dnd-kit` 拖拽需要适配跨 iframe 场景。
- 方案 A（推荐）：拖拽操作在 **编辑器侧** 完成，iframe 只负责渲染。拖拽指示器（drop indicator）覆盖在 iframe 上方。
- 方案 B：使用 `drag-and-drop-iframe-events` 库桥接 iframe 内外的拖拽事件。

**Step 2.5：响应式预览**

- 利用 iframe 天然支持尺寸控制的特性，移除当前 `canvasSize` 对 div 宽度的 hack。
- 直接设置 `<iframe width={canvasSize.width} height={canvasSize.height}>` 即可实现手机/平板/桌面预览。

**Step 2.6：验证**

- 编辑器画布中组件渲染正常，样式无污染。
- 点击组件能正确选中（SelectedMask 定位准确）。
- 拖拽组件到画布功能正常。
- 手机/平板尺寸切换功能正常。
- 自定义 JS 事件在 iframe 沙箱中安全执行（复用现有 `sandboxExecutor`）。

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

1. **Monorepo Foundation**: 3-5 天 (⭐⭐ 中)
2. **Iframe Preview**: 5-7 天 (⭐⭐⭐ 高)
3. **CodeGen Decoupling**: 2-3 天 (⭐ 低)
4. **Collab CRDT**: 7-10 天 (⭐⭐⭐ 高)
