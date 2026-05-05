# 轻量级低代码编辑器 (Low-Code Editor)

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blueviolet" alt="TypeScript">
  <img src="https://img.shields.io/badge/Zustand-5.0-orange" alt="Zustand">
  <img src="https://img.shields.io/badge/Vite-6.3-green" alt="Vite">
  <img src="https://img.shields.io/badge/React%20DND-16-purple" alt="React DND">
  <img src="https://img.shields.io/badge/pnpm%20Monorepo-5pkg-lightgrey" alt="Monorepo">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

<p align="center">
  <strong>一款基于 React + TypeScript 构建的、高度可扩展的低代码编辑器。</strong>
</p>

<p align="center">
  通过<strong>拖拽组件、配置属性</strong>快速搭建 Web 应用原型，并一键导出完整可运行的 React + Vite 源码工程。
  <br>
  核心设计思想：<strong>协议驱动 UI</strong>，编辑态与运行态彻底分离，iframe 沙盒隔离，增量补丁同步。
</p>

---

## 核心特性

### 技术亮点

- **pnpm Monorepo 五包架构** — `schema` / `materials` / `renderer` / `code-generator` / `editor` 职责明确，依赖单向，可独立发布。
- **dev/prod 分离** — 每个物料包含编辑态 (`dev.tsx`) 和运行态 (`prod.tsx`)，编辑器逻辑与业务逻辑彻底解耦。
- **增量补丁同步协议** — Host 与 iframe 之间通过 Immer patches 增量同步，高频拖拽时消息体积降低 90%+，配合 WAL 环形缓冲实现版本断层自愈。
- **反向注册拖放** — 子物料通过 `parentTypes` 声明可被哪些容器接受，容器动态识别合法子物料，无需硬编码。
- **自动化物料注册** — `import.meta.glob` 约定式扫描，新增物料无需修改任何注册代码。
- **antd 元数据自动生成** — `gen:meta` 脚本通过 `react-docgen-typescript` 解析 antd Props，自动生成 `meta.tsx`。
- **增量补丁历史（Undo/Redo）** — 自定义 `undoMiddleware` 捕获 Immer patches，`historyStore` 管理 past/future 栈，预留实时协同编辑接口。
- **模块化出码引擎** — 参考 `alibaba/lowcode-engine` 的 Pipeline 架构，Schema → IR → 插件流水线 → React+Vite 工程包。
- **状态持久化** — 组件树自动保存到 `localStorage`，刷新不丢失进度。

### 编辑器体验

- 可视化拖拽，从物料区拖入画布任意容器，所见即所得
- 动态配置面板：属性 / 样式 / 事件三栏，由物料 `meta` 驱动，无需手写表单
- 样式面板细分六组：布局、定位、字体、边框、背景、其他
- 事件编排：支持调用其他组件方法（含传参）、弹出消息、跳转链接、执行自定义 JS
- 自定义 JS 在 iframe 沙盒中安全执行，`sandbox="allow-scripts"` 隔离，5s 超时保护
- 画布尺寸预设：桌面 / 平板（768px）/ 移动（375px）
- 组件大纲树：层级展示，支持点击定位和拖拽排序
- 组件层级面包屑：面板顶部快速切换父子组件
- 选中遮罩 + 悬浮提示：实时显示组件信息，提供父子导航快捷操作
- 撤销/重做、复制/粘贴/删除全套快捷键
- 一键预览，编辑态与预览态同构渲染，效果 100% 一致
- 一键导出源码，下载完整 React + Vite 工程 `.zip`

---

## 快速开始

**环境要求：** Node.js 18+，pnpm 9+

```bash
# 克隆仓库
git clone https://github.com/xxMudCloudxx/lowcode-editor.git
cd lowcode-editor

# 安装依赖（postinstall 会自动生成物料元数据）
pnpm install

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:5173` 即可使用编辑器。

---

## 项目结构

```
lowcode-editor/
├── packages/
│   ├── schema/          # @lowcode/schema    — 类型协议层（无依赖）
│   ├── materials/       # @lowcode/materials — 物料组件库（34 个组件）
│   ├── renderer/        # @lowcode/renderer  — 纯渲染引擎
│   ├── code-generator/  # @lowcode/code-generator — 出码流水线
│   └── editor/          # @lowcode/editor    — 编辑器主应用
│       └── src/
│           ├── editor/
│           │   ├── components/   # 编辑器 UI（画布、面板、遮罩等）
│           │   ├── stores/       # Zustand stores（components / history / ui）
│           │   ├── simulator/    # Host/Renderer 通信协议
│           │   ├── hooks/        # 自定义 Hooks
│           │   └── utils/        # 工具函数（sandboxExecutor 等）
│           ├── renderer/         # iframe 内的 RendererApp 入口
│           └── theme/            # Antd 双令牌主题配置
├── docs/                # 架构文档、产品文档、路线图
└── pnpm-workspace.yaml
```

---

## 架构概览

### Monorepo 依赖拓扑

```
@lowcode/schema
    ↑
@lowcode/materials ── @lowcode/renderer
    ↑                       ↑
@lowcode/code-generator   @lowcode/editor（主应用）
```

### 状态管理三 Store 分离

| Store | 中间件 | 职责 |
|-------|--------|------|
| `useComponentsStore` | immer + persist | 组件树 Master，范式化存储，版本号自增 |
| `useHistoryStore` | 无 | 增量 patch 历史栈，undo/redo，协同预留接口 |
| `useUIStore` | immer | 选中 id、模式、画布尺寸、剪切板（不持久化） |

### Host ↔ Iframe 增量同步协议

```
useComponentsStore
    ↓ undoMiddleware 捕获 patches
patchEventBus
    ↓
SimulatorHost ──postMessage(SYNC_COMPONENTS_PATCH)──→ SimulatorRenderer
                                                            ↓
                                                      版本校验
                                                      ↓ 通过      ↓ 断层
                                                  applyPatches  REQUEST_FULL_SNAPSHOT
                                                                      ↓
                                                              WAL 回放 or 全量快照
```

**Host 是 Store 的唯一 Master，Iframe 持有只读 Slave Replica，所有写操作通过 `DISPATCH_ACTION` 委托给 Host。**

### 出码流水线

```
Schema → Parser → IR → Preprocessor → Component Plugins → Project Plugins
                                                                ↓
                                                        Postprocessor (prettier)
                                                                ↓
                                                        Publisher (JSZip → .zip)
```

---

## 物料系统

### 已有物料（34 个）

| 分类 | 组件 |
|------|------|
| General | Button、Icon、Typography |
| Layout | Container、Grid、GridColumn、Space |
| Navigation | Breadcrumb、Dropdown、Menu、PageHeader、Pagination、Steps、TabPane |
| DataEntry | Input、Radio、Select、Slider、Switch、Upload |
| DataDisplay | Avatar、Card、Image、List、ListItem、TableColumn、Tooltip |
| Feedback | Modal |
| Page | Root 页面组件 |

### 新增物料

每个物料包含三个文件：

```
materials/
└── YourComponent/
    ├── dev.tsx    # 编辑态（含拖拽锚点、选中高亮）
    ├── prod.tsx   # 运行态（纯业务逻辑）
    └── meta.tsx   # 元数据（setter 配置、事件、方法、parentTypes）
```

新增后无需修改任何注册代码，`import.meta.glob` 自动发现。

---

## 常用命令

```bash
# 开发
pnpm dev                                    # 启动编辑器开发服务器
pnpm --filter @lowcode/materials gen:meta   # 生成 antd 组件元数据

# 构建（顺序：schema → code-generator → editor）
pnpm build

# 测试
pnpm test          # 全部包
pnpm test:coverage # 覆盖率报告

# 代码检查
pnpm lint
```

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 5.8 |
| 构建 | Vite 6.3 + pnpm Monorepo + tsup |
| 状态 | Zustand 5 + Immer（patches + applyPatches） |
| 拖拽 | React-DND 16 |
| UI | Ant Design 5（CSS-in-JS 双令牌主题） |
| 编辑器 | Monaco Editor 0.52 |
| 出码 | JSZip + Prettier + 自研 Pipeline |
| 测试 | Vitest + Testing Library |

---

## 路线图

- **第一阶段** ✅ — 撤销/重做、复制粘贴删除、大纲树拖拽排序
- **第二阶段** ✅ — 高级样式面板、栅格/Tabs/图表组件、Monorepo 重构、增量补丁同步协议
- **第三阶段** 规划中 — 全局状态与数据源管理、数据绑定、多页面支持
- **第四阶段** 规划中 — 实时协同编辑（WebSocket + 已预留 `applyRemotePatch` 接口）

---

## 贡献

欢迎提交 Issue 和 PR。新增物料请遵循上方"新增物料"规范。

---

## 致谢

- 初始架构参考了稀土掘金小册[《React 通关秘籍》](https://juejin.cn/book/7294082310658326565)（作者：zxg\_神说要有光）
- 出码引擎架构参考了 [alibaba/lowcode-engine](https://github.com/alibaba/lowcode-engine)
- 感谢 Vite、React、Zustand、Ant Design 等开源项目

## 许可证

[MIT](https://github.com/xxMudCloudxx/lowcode-editor/blob/main/LICENSE) © 2025 xxMudCloudxx

---

<p align="center">
<img src=https://img.shields.io/github/stars/xxMudCloudxx/lowcode-editor?style=social alt="GitHub stars">
<img src=https://img.shields.io/github/forks/xxMudCloudxx/lowcode-editor?style=social alt="GitHub forks">
</p>
