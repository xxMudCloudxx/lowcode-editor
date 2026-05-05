# Ali LowCodeEngine 架构研究：Simulator / Renderer 分离模式

> 研究日期：2026-02-22
> 目的：为我们的 `@lowcode/renderer` 包设计提供架构参考

---

## 1. 整体包结构与职责分离

Ali LowCodeEngine 的核心渲染相关包：

```
packages/
├── designer/                     # 设计器核心（宿主侧，运行在主页面）
│   └── src/
│       ├── builtin-simulator/
│       │   ├── host.ts           # BuiltinSimulatorHost - iframe 外部的控制器
│       │   ├── create-simulator.ts  # 创建 iframe 并注入资源
│       │   ├── viewport.ts       # 视口管理
│       │   └── renderer.ts       # BuiltinSimulatorRenderer 接口定义
│       ├── document/             # DocumentModel（节点树模型）
│       └── designer/             # Designer（拖拽、选中、悬停等交互）
│
├── renderer-core/                # 框架无关的渲染核心（纯逻辑）
│   └── src/
│       ├── adapter/              # 适配器模式 - 注入具体框架实现
│       ├── renderer/
│       │   ├── base.tsx          # BaseRenderer - 所有渲染器的基类
│       │   ├── renderer.tsx      # 顶层 Renderer（入口组件）
│       │   ├── page.tsx          # PageRenderer
│       │   ├── component.tsx     # ComponentRenderer
│       │   ├── block.tsx         # BlockRenderer
│       │   └── ...
│       ├── hoc/
│       │   └── leaf.tsx          # LeafWrapper HOC - 设计态节点级响应式
│       ├── types/                # 类型定义
│       ├── context/              # React Context
│       └── utils/                # 工具方法（表达式解析、数据处理等）
│
├── react-renderer/               # React 具体实现（适配层）
│   └── src/index.ts              # 注册 React 运行时 + 生成渲染器
│
├── react-simulator-renderer/     # React 模拟器渲染器（设计态，运行在 iframe 内）
│   └── src/
│       ├── renderer.ts           # SimulatorRendererContainer + DocumentInstance
│       ├── renderer-view.tsx     # 视图层（Routes, Layout, Renderer 组件）
│       └── host.ts               # 从 window.LCSimulatorHost 获取宿主引用
```

### 核心分层原则

```
┌──────────────────────────────────────────────────────┐
│                    Host (主页面)                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Designer (designer 包)                          │ │
│  │  - BuiltinSimulatorHost                          │ │
│  │  - Dragon (拖拽引擎)                              │ │
│  │  - Detecting (悬停检测)                           │ │
│  │  - Selection (选中管理)                           │ │
│  │  - DocumentModel (文档节点模型)                    │ │
│  └───────────┬─────────────────────────────────────┘ │
│              │ window.LCSimulatorHost                 │
│              │ (全局变量通信)                          │
│  ┌───────────▼─────────────────────────────────────┐ │
│  │  iframe (Simulator)                              │ │
│  │  ┌───────────────────────────────────────────┐   │ │
│  │  │ react-simulator-renderer                  │   │ │
│  │  │  - SimulatorRendererContainer             │   │ │
│  │  │  - DocumentInstance                       │   │ │
│  │  │  ┌─────────────────────────────────────┐  │   │ │
│  │  │  │ react-renderer (LowCodeRenderer)    │  │   │ │
│  │  │  │  ┌──────────────────────────────┐   │  │   │ │
│  │  │  │  │ renderer-core (BaseRenderer) │   │  │   │ │
│  │  │  │  └──────────────────────────────┘   │  │   │ │
│  │  │  └─────────────────────────────────────┘  │   │ │
│  │  └───────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 2. Adapter 模式：框架无关设计

`renderer-core` 通过 **Adapter 单例** 实现框架无关：

```typescript
// renderer-core/src/adapter/index.ts
class Adapter {
  runtime: IRuntime;          // { Component, PureComponent, createElement, ... }
  renderers: IRendererModules; // { PageRenderer, ComponentRenderer, ... }
  configProvider: any;         // 如 Antd ConfigProvider

  setRuntime(runtime: IRuntime) { ... }
  setRenderers(renderers: IRendererModules) { ... }
  setConfigProvider(Comp: any) { ... }
}
export default new Adapter(); // 全局单例
```

**具体框架层** (如 `react-renderer`) 负责注入：

```typescript
// react-renderer/src/index.ts
import { adapter, pageRendererFactory, componentRendererFactory, ... } from '@alilc/lowcode-renderer-core';

// 1. 注入框架运行时
adapter.setRuntime({
  Component: React.Component,
  PureComponent: React.PureComponent,
  createElement: React.createElement,
  createContext: React.createContext,
  forwardRef: React.forwardRef,
  findDOMNode: ReactDOM.findDOMNode,
});

// 2. 注入各类渲染器（使用 core 工厂函数生成）
adapter.setRenderers({
  PageRenderer: pageRendererFactory(),
  ComponentRenderer: componentRendererFactory(),
  BlockRenderer: blockRendererFactory(),
  ...
});

// 3. 注入 ConfigProvider
adapter.setConfigProvider(ConfigProvider);
```

**关键洞察**：`renderer-core` 中所有代码使用 `adapter.getRuntime()` 获取 `createElement` 等方法，而不直接 import React。这使得同一套 schema → VirtualDOM 逻辑可以服务于 React、Rax 等不同框架。

---

## 3. BaseRenderer：Schema → DOM 的核心引擎

`BaseRenderer` 是所有渲染器（Page/Component/Block/...）的基类，核心职责：

### 3.1 Schema 递归渲染

```
__createDom()
  └── __createVirtualDom(schema, scope, parentInfo)
        ├── 处理 JSExpression / i18n / JSSlot / 基本类型
        ├── 查找组件: components[schema.componentName]
        ├── 解析 props: __parseProps(schema.props, scope)
        ├── 处理 loop: __createLoopVirtualDom()
        ├── 处理 condition: schema.condition
        ├── 应用 HOCs: __componentHOCs (leafWrapper + compWrapper)
        └── engine.createElement(Comp, props, children)
```

### 3.2 关键方法

| 方法                       | 职责                                               |
| -------------------------- | -------------------------------------------------- |
| `__createVirtualDom`       | 递归将 schema 节点转换为虚拟 DOM                   |
| `__parseProps`             | 解析属性中的 JSExpression、JSSlot、i18n 等协议数据 |
| `__parseExpression`        | 执行 `{{ }}` 或 `JSExpression` 表达式              |
| `__initDataSource`         | 初始化数据源(远程请求)                             |
| `__bindCustomMethods`      | 绑定 schema.methods 中的自定义方法到 this          |
| `__executeLifeCycleMethod` | 执行 schema.lifeCycles 中的生命周期                |
| `__renderContextProvider`  | 提供 AppContext (engine, components, appHelper)    |

### 3.3 设计态 vs 运行态的分歧点

```typescript
// BaseRenderer 中通过 designMode 判断
get __designModeIsDesign() {
  return this.context?.engine?.props?.designMode === 'design';
}

// 设计态才注入 LeafWrapper HOC（支持节点级响应式渲染）
get __componentHOCs(): IComponentConstruct[] {
  if (this.__designModeIsDesign) {
    return [leafWrapper, compWrapper]; // 设计态：leaf + comp
  }
  return [compWrapper]; // 运行态：仅 comp
}
```

---

## 4. iframe 架构：Host ↔ Simulator 通信

### 4.1 iframe 创建流程 (`create-simulator.ts`)

```typescript
export function createSimulator(
  host,
  iframe,
  vendors,
): Promise<BuiltinSimulatorRenderer> {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;

  // 1. 将主页面的引擎实例挂到 iframe window 上
  win.AliLowCodeEngine = innerPlugins._getLowCodePluginContext({});

  // 2. 关键！将 host（设计器控制器）挂到 iframe window 上
  win.LCSimulatorHost = host;

  // 3. 共享 React 等基础库（避免重复加载）
  // 通过注入 JS 代码：window.React = parent.React;
  // 这样 iframe 内的渲染器使用主页面的 React 实例

  // 4. 写入 HTML：注入 CSS + JS 资源（组件库、渲染器等）
  doc.open();
  doc.write(`<!doctype html>
    <html class="engine-design-mode">
      <head>${styleFrags}</head>
      <body>${scriptFrags}</body>
    </html>`);
  doc.close();

  // 5. 等待 iframe 加载完成，返回 window.SimulatorRenderer
  return new Promise((resolve) => {
    resolve(win.SimulatorRenderer || host.renderer);
  });
}
```

### 4.2 Host → Simulator 通信机制

**不使用 postMessage！** 而是直接通过共享引用：

```typescript
// iframe 内 (host.ts):
export const host: BuiltinSimulatorHost = (window as any).LCSimulatorHost;
// 直接引用主页面的 host 对象，可以调用其方法、读取其属性
```

**双向通信方式**：

| 方向                | 机制                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Host → Simulator    | `host.connect(renderer, autorunEffect)` — 使用 MobX autorun 观察 host 属性变化，自动同步到 renderer |
| Simulator → Host    | `host.setInstance(docId, id, instances)` — renderer 直接调用 host 方法上报组件实例                  |
| Host 读取 Simulator | `host.renderer.getComponent()`, `host.renderer.findDOMNodes()` 等                                   |

### 4.3 MobX 驱动的响应式同步

```typescript
// SimulatorRendererContainer.constructor()
this.disposeFunctions.push(
  host.connect(this, () => {
    // host 的任何 observable 属性变化时，自动触发
    this._layout = host.project.get("config").layout;
    this._libraryMap = host.libraryMap;
    this._componentsMap = host.designer.componentsMap;
    this._designMode = host.designMode;
    this._locale = host.locale;
    this._device = host.device;
    // → 触发 MobX 响应式 → 自动重渲染
  }),
);
```

---

## 5. SimulatorRendererContainer：设计态渲染容器

### 5.1 核心类结构

```
SimulatorRendererContainer (singleton)
  ├── _components: Record<string, React.FC | React.ComponentClass>  // 所有已加载组件
  ├── _documentInstances: DocumentInstance[]                         // 多文档实例
  ├── history: MemoryHistory                                        // 内存路由
  ├── _appContext: { utils, constants, requestHandlersMap }         // 全局上下文
  │
  ├── buildComponents()    # libraryMap + componentsMap → 具体组件类
  ├── load(asset)          # 加载 UMD 资源
  ├── createComponent()    # 创建低代码组件类（内嵌 LowCodeRenderer）
  ├── run()                # 挂载到 iframe 的 #app，启动渲染
  └── rerender()           # 强制重渲染

DocumentInstance (per document)
  ├── instancesMap: Map<nodeId, ReactInstance[]>  // 节点 → DOM 实例映射
  ├── schema    # 从 document.export(Render) 获取
  ├── components, designMode, device, ...
  │
  ├── mountInstance(id, instance)   # 组件挂载时注册实例
  └── getNode(id)                  # 获取节点模型
```

### 5.2 渲染链路

```
SimulatorRendererContainer.run()
  └── ReactDOM.render(<SimulatorRendererView>)
        └── <Router>
              └── <Layout>
                    └── <Routes>
                          └── <Route> × N (每个 DocumentInstance 一个路由)
                                └── <Renderer documentInstance={...}>
                                      └── <LowCodeRenderer          // react-renderer
                                            schema={documentInstance.schema}
                                            components={container.components}
                                            designMode={designMode}
                                            customCreateElement={...}  // 注入设计态能力
                                            onCompGetRef={...}         // 实例收集
                                            __host={host}
                                            __container={container}
                                          />
```

### 5.3 customCreateElement：注入设计态编辑能力

这是最关键的设计模式之一——通过 `customCreateElement` 钩子，在渲染每个组件时注入设计态逻辑：

```typescript
customCreateElement={(Component, props, children) => {
  const { __id, ...viewProps } = props;
  viewProps.componentId = __id;

  // 获取节点模型引用
  const leaf = documentInstance.getNode(__id) as Node;
  viewProps._leaf = leaf.internalToShellNode();
  viewProps._componentName = leaf?.componentName;

  // 空容器占位 → 方便拖拽
  if (leaf?.isContainer() && !children?.length && !viewProps.style) {
    children = <div className="lc-container-placeholder">
      拖拽组件或模板到这里
    </div>;
  }

  // 使用设备视图组件（如 Mobile 变体）
  return createElement(
    getDeviceView(Component, device, designMode),
    viewProps,
    children
  );
}}
```

---

## 6. LeafWrapper HOC：节点级响应式渲染

`LeafWrapper` 是设计态独有的 HOC，它监听 DocumentModel 中节点的变化并触发精确重渲染：

```
DocumentModel (Node Tree)
  └── Node
        ├── onPropChange    →  LeafHoc.setState({ nodeProps })
        ├── onChildrenChange →  LeafHoc.setState({ nodeChildren })
        └── onVisibleChange  →  LeafHoc.setState({ visible })
```

**核心机制**：

1. 每个组件被 `leafWrapper` HOC 包裹
2. HOC 订阅该节点的 `onPropChange` / `onChildrenChange` / `onVisibleChange` 事件
3. 属性/子节点/可见性变化时，仅重渲染该组件，而非整棵树
4. 支持**最小渲染单元**(MinimalRenderUnit)优化——某些容器组件作为渲染边界

**运行态不使用 LeafWrapper**：因为运行态没有 DocumentModel，不需要节点级监听。

---

## 7. Preview/Runtime 渲染

### 7.1 运行态 (react-renderer)

运行态**不使用 iframe**，直接使用 `react-renderer`：

```tsx
import LowCodeRenderer from "@alilc/lowcode-react-renderer";

<LowCodeRenderer
  schema={schema} // 从搭建协议导出的 JSON
  components={components} // 组件映射表
  designMode="" // 空 = 运行态
  appHelper={appHelper}
/>;
```

运行态特点：

- 无 `LeafWrapper`（没有 `_leaf` 节点引用）
- 无 `customCreateElement`（标准 createElement）
- 无 `onCompGetRef`/`onCompGetCtx` 回调
- 直接渲染 schema 为 DOM，不经过 DocumentModel

### 7.2 designMode 差异表

| 特性            | `design` (设计态)              | `''` (运行态/预览态) |
| --------------- | ------------------------------ | -------------------- |
| 运行环境        | iframe 内                      | 直接在页面中         |
| HOC 包裹        | `leafWrapper` + `compWrapper`  | 仅 `compWrapper`     |
| 事件处理        | 设计器拦截 click/mouseover 等  | 正常事件响应         |
| 空容器          | 显示占位提示                   | 不渲染               |
| Overlay 组件    | 包裹 Div 以使其可见            | 正常渲染             |
| schema 来源     | `document.export(Render)` 实时 | 静态 JSON            |
| condition=false | 仍渲染(通过 LeafWrapper 隐藏)  | 不渲染               |

---

## 8. 对我们项目的架构启示

### 8.1 推荐采用的核心模式

#### A. Renderer 包分层

```
@lowcode/renderer-core      # 框架无关的渲染核心
  ├── schema → component tree 递归渲染
  ├── 表达式解析 / 数据源 / 生命周期
  └── Adapter pattern (注入 createElement 等)

@lowcode/renderer            # React 具体实现（当前包）
  ├── 注入 React runtime 到 adapter
  └── 导出 Renderer 组件

@lowcode/editor              # 设计器（已有）
  └── iframe simulator
        ├── 加载 @lowcode/renderer
        ├── 注入设计态能力 (customCreateElement / onCompGetRef)
        └── 与 host 通信
```

#### B. 设计态 vs 运行态分歧点

不要在 renderer 内部硬编码设计态逻辑。通过以下接口让外部注入：

```typescript
interface RendererProps {
  schema: ComponentTree;
  components: Record<string, React.ComponentType>;

  // 设计态注入点（运行态不传即可）
  designMode?: "design" | "";
  customCreateElement?: (Comp, props, children) => ReactElement;
  onCompGetRef?: (schema, ref) => void;
  getNode?: (id: string) => NodeModel | null;
}
```

#### C. iframe 通信：共享引用 > postMessage

Ali 的方案证明了**同域 iframe + 共享引用**比 postMessage 更高效：

- 主页面将 host 对象挂到 `iframe.contentWindow.LCSimulatorHost`
- iframe 内可直接调用 host 方法、访问 Observable 属性
- 使用 MobX/响应式库自动同步状态变化

#### D. 组件实例收集

设计态需要知道每个 schema 节点对应的 DOM 实例（用于计算选中框、悬停框位置）：

```typescript
// 渲染时
onCompGetRef={(schema, ref) => {
  documentInstance.mountInstance(schema.id, ref);
}}

// Host 侧使用
const instances = host.getComponentInstances(node);
const rect = host.computeComponentInstanceRect(instances[0]);
// → 用 rect 绘制选中框/悬停框 overlay
```

#### E. Schema → DOM 的关键管道

```
Schema (JSON)
  → DocumentModel (设计态) or 直接使用 (运行态)
    → export(RenderStage)
      → Renderer 递归
        → 查找组件 components[componentName]
        → 解析 props (JSExpression/i18n/JSSlot)
        → 处理 loop / condition
        → HOC 包裹 (设计态: LeafWrapper)
        → createElement(Comp, resolvedProps, children)
```

### 8.2 与我们当前 Renderer 的差距

当前 `@lowcode/renderer` (packages/renderer/src/index.tsx) 是一个简单的递归渲染器。对比 Ali 的设计，我们需要考虑：

1. **表达式系统**: 支持 JSExpression 在 props 中的解析
2. **设计态钩子**: `customCreateElement` / `onCompGetRef` 接口
3. **条件/循环**: condition + loop 在 schema 层级的处理
4. **分层**: 将纯渲染逻辑（schema→DOM）与 React 具体实现分离
5. **生命周期桥接**: schema.lifeCycles → 组件生命周期调用

### 8.3 建议的最小可行架构

对于我们的场景（React only、Ant Design），不需要 adapter 模式的框架无关设计，但应保留：

```
@lowcode/renderer
  ├── RendererProvider       # Context: components, appHelper, designMode
  ├── SchemaRenderer         # 递归渲染 schema → React 元素
  │    ├── 组件查找
  │    ├── props 解析（表达式、插槽）
  │    ├── condition / loop 处理
  │    └── 设计态钩子 (customCreateElement, onCompGetRef)
  └── types                  # RendererProps, RendererContext 等接口
```

设计态 (editor 内 iframe) 和运行态 (preview) 使用同一个 `SchemaRenderer`，通过 `designMode` + `customCreateElement` 等 props 差异化行为。

---

## 9. 关键接口契约总结

### Renderer 对外接口

```typescript
interface RendererProps {
  // 必需
  schema: RootSchema; // 页面/组件的完整 schema
  components: Record<string, ComponentType>; // 组件名 → 组件类映射

  // 运行态配置
  locale?: string;
  messages?: Record<string, any>; // i18n 语料
  appHelper?: {
    utils: Record<string, any>;
    constants: Record<string, any>;
    history: History;
    location: Location;
  };

  // 设计态配置
  designMode?: "design" | "preview" | "";
  customCreateElement?: (Comp, props, children) => ReactElement;
  onCompGetRef?: (schema: NodeSchema, ref: ReactInstance) => void;
  onCompGetCtx?: (schema: NodeSchema, ctx: any) => void;
  getNode?: (id: string) => Node | null; // 获取节点模型
  __host?: SimulatorHost; // 设计器宿主引用
  __container?: SimulatorRendererContainer; // 渲染容器引用
}
```

### Host ↔ Simulator 接口

```typescript
interface SimulatorHost {
  // 提供给 Simulator
  project: Project;
  designer: Designer;
  designMode: string;
  device: string;
  locale: string;
  libraryMap: Record<string, string>;
  componentsMap: Record<string, ComponentMetadata>;
  thisRequiredInJSE: boolean;

  // Simulator 回调
  setInstance(
    docId: string,
    nodeId: string,
    instances: ComponentInstance[],
  ): void;
  connect(renderer: SimulatorRenderer, effect: () => void): Disposer;
}

interface SimulatorRenderer {
  // Host 调用
  getComponent(name: string): Component | null;
  getClosestNodeInstance(
    from: ReactInstance,
    specId?: string,
  ): NodeInstance | null;
  findDOMNodes(instance: ReactInstance): Array<Element | Text> | null;
  getClientRects(element: Element | Text): DOMRect[];
  setNativeSelection(enable: boolean): void;
  setDraggingState(state: boolean): void;
  run(): void;
  rerender(): void;
  load(asset: Asset): Promise<void>;
}
```
