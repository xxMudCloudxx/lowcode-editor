# Monorepo 架构说明

本项目已重构为 **Monorepo** 架构，使用 **pnpm workspaces** 进行包管理。

## 📦 包结构

```
lowcode-editor/
├── packages/
│   ├── schema/              # 类型定义和协议层
│   ├── materials/           # 物料组件库
│   ├── renderer/            # 纯渲染引擎
│   ├── code-generator/      # 代码生成器
│   └── editor/              # 编辑器主应用
├── pnpm-workspace.yaml
└── package.json
```

## 🔗 包依赖关系

```
@lowcode/schema (基础类型层)
    ↓
@lowcode/materials ──→ @lowcode/schema
    ↓
@lowcode/renderer ──→ @lowcode/materials ──→ @lowcode/schema
    ↓
@lowcode/code-generator ──→ @lowcode/schema
    ↓
@lowcode/editor ──→ @lowcode/renderer
                ──→ @lowcode/materials
                ──→ @lowcode/code-generator
                ──→ @lowcode/schema
```

## 🛠️ 构建说明

### 重要：构建顺序

由于某些包导出编译后的 `dist` 目录，**必须按正确顺序构建**：

1. **`@lowcode/schema`** - 导出 `dist/index.js` 和 `dist/index.d.ts`
2. **`@lowcode/code-generator`** - 导出 `dist/index.js` 和 `dist/index.d.ts`
3. **`@lowcode/editor`** - 依赖上述两个包的构建产物

### 构建命令

```bash
# 构建所有包（按依赖顺序）
pnpm build

# 或手动按顺序构建
pnpm --filter @lowcode/schema build
pnpm --filter @lowcode/code-generator build
pnpm --filter @lowcode/editor build
```

### 开发模式

```bash
# 启动编辑器开发服务器
pnpm dev

# 监听模式构建特定包
pnpm --filter @lowcode/schema dev
```

## 📝 各包说明

### @lowcode/schema
- **作用**: 提供共享的 TypeScript 类型定义和协议
- **构建**: 使用 `tsup` 编译为 CommonJS 和 ESM 格式
- **输出**: `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts`

### @lowcode/materials
- **作用**: 物料组件库，包含所有可拖拽的组件
- **导出**: 直接导出源码 `src/index.tsx`（无需构建）
- **包含**: General, Layout, DataEntry, DataDisplay 等物料分类

### @lowcode/renderer
- **作用**: 纯渲染引擎，将 Schema 转换为 React 组件
- **导出**: 直接导出源码 `src/index.tsx`（无需构建）

### @lowcode/code-generator
- **作用**: 将 Schema 导出为完整的 React + Vite 项目
- **构建**: 使用 `tsup` 编译为 CommonJS 和 ESM 格式
- **输出**: `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts`

### @lowcode/editor
- **作用**: 编辑器主应用，包含画布、设置面板等 UI
- **构建**: 使用 `vite` 构建为静态网站
- **输出**: `dist/index.html` 和静态资源

## 🚀 CI/CD 说明

GitHub Actions 工作流已更新以支持 Monorepo 架构：

```yaml
# 先构建依赖包
- name: Build dependencies
  run: pnpm --filter @lowcode/schema --filter @lowcode/code-generator build

# 再构建编辑器
- name: Build editor
  run: pnpm --filter @lowcode/editor build
```

## ⚠️ 常见问题

### Q: 为什么有些包需要构建，有些不需要？
A: 
- **需要构建**: `schema` 和 `code-generator` 导出编译后的代码（`dist`），需要先用 `tsup` 构建
- **无需构建**: `materials` 和 `renderer` 直接导出源码（`src`），由消费者（`editor`）的构建工具处理

### Q: 本地开发时是否需要先构建依赖包？
A: 
- 如果你只修改 `editor` 包的代码，不需要
- 如果你修改了 `schema` 或 `code-generator`，需要重新构建这些包：
  ```bash
  pnpm --filter @lowcode/schema build
  # 或使用 dev 模式自动监听
  pnpm --filter @lowcode/schema dev
  ```

### Q: 如何添加新的依赖？
A:
```bash
# 为特定包添加依赖
pnpm --filter @lowcode/editor add lodash

# 为所有包添加开发依赖
pnpm add -Dw typescript

# 添加 workspace 内部依赖（已在 package.json 中配置）
# 使用 "workspace:*" 版本号
```
