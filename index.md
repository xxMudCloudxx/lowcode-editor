# lowcode-editor — 项目快速入口

> 给所有 agent 和新成员看的项目总览。深度文档见 `docs/`。

---

## 这是什么

基于 React + TypeScript 的低代码编辑器。用户通过拖拽组件、配置属性搭建页面，可一键导出完整 React + Vite 源码工程。

**pnpm Monorepo，5 个包：**

| 包 | 路径 | 职责 |
|----|------|------|
| `@lowcode/schema` | `packages/schema/` | 类型协议层，所有包的共同语言 |
| `@lowcode/materials` | `packages/materials/` | 34 个可拖拽物料组件 |
| `@lowcode/renderer` | `packages/renderer/` | 纯渲染引擎，零副作用 |
| `@lowcode/code-generator` | `packages/code-generator/` | Schema → React+Vite 工程包 |
| `@lowcode/editor` | `packages/editor/` | 编辑器主应用，依赖以上全部 |

**依赖方向（单向，不可逆）：**
```
schema ← materials ← renderer ← editor
schema ←────────── code-generator ←─┘
```

---

## 编辑器内部结构

```
packages/editor/src/
├── editor/
│   ├── components/     # 编辑器 UI（画布、面板、遮罩、大纲树）
│   ├── stores/         # 三个 Zustand Store（见下）
│   ├── simulator/      # Host ↔ Iframe 通信协议
│   ├── hooks/          # 拖放、快捷键、样式变更等 Hooks
│   └── utils/          # sandboxExecutor、patchEventBus 等
├── renderer/           # iframe 内的 RendererApp 入口
└── theme/              # Antd 双令牌主题配置
```

---

## 三个核心 Store

| Store | 文件 | 中间件 | 职责 |
|-------|------|--------|------|
| `useComponentsStore` | `stores/components.tsx` | immer + persist | 组件树 Master，范式化存储，版本号自增 |
| `useHistoryStore` | `stores/historyStore.ts` | 无 | Immer patch 历史栈，undo/redo |
| `useUIStore` | `stores/uiStore.ts` | immer | 选中 id、模式、画布尺寸、剪切板（不持久化） |

**关键约定：** `useUIStore` 不接 persist 和 temporal，UI 状态不进撤销栈。

---

## Host ↔ Iframe 通信（最复杂的模块）

- 文件：`editor/simulator/SimulatorHost.ts`、`SimulatorRenderer.ts`、`protocol.ts`
- **Host 是唯一 Master**，Iframe 持有只读副本
- 组件状态通过 **Immer 增量 patches** 同步（不是全量 subscribe）
- WAL 环形缓冲（50 条）+ 版本号校验，断层时自愈降级到全量快照
- 大组件树按 100 节点分片传输
- Iframe 的写操作通过 `DISPATCH_ACTION` 消息委托给 Host 执行

---

## 物料规范

每个物料三个文件：

```
materials/YourComponent/
├── dev.tsx    # 编辑态（含拖拽锚点）
├── prod.tsx   # 运行态（纯业务逻辑）
└── meta.tsx   # SetterConfig / EventConfig / parentTypes
```

- `parentTypes` 声明可被哪些容器接受（反向注册，不硬编码）
- 新增物料无需修改注册代码，`import.meta.glob` 自动发现

---

## 常用命令

```bash
pnpm install                                  # 安装（postinstall 自动生成物料元数据）
pnpm dev                                      # 启动编辑器开发服务器
pnpm build                                    # 构建全部包
pnpm test                                     # 运行全部测试
pnpm --filter @lowcode/materials gen:meta     # 重新生成 antd 组件元数据
pnpm --filter @lowcode/schema build           # 单独构建 schema 包
pnpm --filter @lowcode/code-generator build   # 单独构建出码包
```

**构建顺序（有依赖关系）：** schema → code-generator → editor

---

## 深度文档

| 文档 | 内容 |
|------|------|
| [docs/architecture/architecture_summary_2.md](docs/architecture/architecture_summary_2.md) | 10 模块架构深度拆解（面试/简历级别） |
| [docs/index.md](docs/index.md) | docs/ 目录导航与文档放置规范 |
| [docs/plans/active/](docs/plans/active/) | 当前进行中的计划 |
| [ROADMAP.md](ROADMAP.md) | 功能路线图 |
| [MONOREPO.md](MONOREPO.md) | Monorepo 包管理指南 |
