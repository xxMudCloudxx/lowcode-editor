# Monorepo 重构实战：基于 STAR 法则的面试报告

本文档基于项目实际代码变更（`main` vs `refactor/monorepo-foundation`）编写，严格遵循事实，旨在复盘从单体架构迁移至 Monorepo 的工程化实践。

---

## 🏗️ S - 情境 (Situation)

### 1. 原始架构（单体 Monolith）

**现状**：
我们的低代码编辑器原本是一个标准的 Vite + React 单体项目。所有的代码逻辑都混杂在 `src/` 目录下：

- **Editor** (`src/editor`)：包含编辑器 UI、Monaco Editor、React-DND 等重交互逻辑。
- **Renderer** (`src/renderer` - _逻辑上区分_): 负责组件渲染，但在物理上与 Editor 共享同一个 `package.json` 和 `tsconfig.json`。
- **Materials** (`src/materials`)：存放 Button, Input 等业务组件及其元数据。
- **CodeGen** (`src/code-generator`)：出码逻辑，直接引用了项目中的其他 TS 类型。

### 2. 面临的具体挑战

虽然项目在 `main` 分支已经具备了不错的特性（如自动化物料注册、Antd 元数据生成），但随着架构演进，单体结构的**物理耦合**带来了明显的工程瓶颈：

- **依赖边界不清（幽灵依赖）**：
  - 所有的包共享顶层 `node_modules`。`Renderer`（本应只依赖 React）理论上不应访问 `Monaco Editor`，但在单体架构下没有任何强制约束，导致渲染器可能意外引入编辑器的重型依赖。
- **工具链无法独立**：
  - `src/code-generator` 虽然逻辑上是独立的，但无法单独作为一个 NPM 包发布，也难以在不安装图形界面的 CI/CD 环境中通过 install 独立运行。
- **循环引用风险**：
  - `Editor` 依赖 `Materials`，而 `Materials` 为了获得类型提示，往往又反向引用 `Editor` 中的类型定义。这种循环依赖在单体项目中很难被发现，但在严格分包时会直接报错。

---

## 🎯 T - 任务 (Task)

我的目标是将这个单体应用重构为工业标准的 **Monorepo** 架构，实现以下 **“物理隔离”** 目标：

1.  **抽离核心协议 (`@lowcode/schema`)**：建立全项目的“单一事实源”，解决循环依赖问题。
2.  **独立物料包 (`@lowcode/materials`)**：将原有的自动化物料系统完整迁移到独立包中，确保其不依赖 Editor 上下文。
3.  **独立渲染器 (`@lowcode/renderer`)**：剥离出一个干净的渲染器骨架，为后续的 Iframe 沙箱隔离预览打下基础。
4.  **独立出码引擎 (`@lowcode/code-generator`)**：确保出码逻辑可以作为独立的 Node.js 库运行。

---

## ⚡ A - 行动 (Action)

我利用 `pnpm workspace` 进行了为期一周的重构，核心动作如下：

### 1. 解决循环依赖：提取 `@lowcode/schema`

- **问题**：在 `main` 分支中，`code-generator` 引用了 `editor` 中的类型，导致无法分包。
- **行动**：我将 `ComponentNode`, `ProjectSchema` 等核心 TS 接口，以及 `useComponentStore` 所依赖的数据模型，全部提取到了 `@lowcode/schema` 包中。
- **结果**：它是所有包的底层依赖（Base），没有任何上层依赖，彻底斩断了环状引用。

### 2. 迁移并适配自动化物料系统

- **背景**：原项目拥有优秀的自动化机制（利用 `import.meta.glob` 自动注册物料，利用 `gen:antd` 脚本自动生成元数据）。
- **挑战**：这些脚本原本是写死在根目录的，且依赖根目录的相对路径。
- **行动**：
  - 将 `src/materials` 完整移动到 `packages/materials`。
  - **重构脚本**：修改 `scripts/gen-antd-metas.ts` 的路径解析逻辑，使其适应 Monorepo 的目录结构（指向 `packages/materials` 而非 `src`）。
  - **保留特性**：确保在分包后，`pnpm dev` 依然能触发 `predev` 钩子自动生成元数据，且 Vite 的 Glob 导入依然有效。

### 3. 构建隔离的渲染器骨架

- **行动**：创建 `packages/renderer`。
- **实现**：编写了一个极简的 `index.tsx`，仅依赖 `react` 和 `@lowcode/schema`，通过递归 `React.createElement` 实现组件树渲染。
- **关键点**：特意移除了所有与 `react-dnd` (拖拽) 相关的逻辑，确保渲染器是“只读”且轻量的。这为后续实现 `<iframe src="/preview.html" />` 的秒级加载提供了可能（虽然目前尚未完全优化体积，但结构已就位）。

### 4. 工程化配置落地

- **Vite 改造**：在 `packages/editor/vite.config.ts` 中配置 `resolve.alias` 和 `server.fs.allow`，确保在开发模式下，编辑器可以直接引用 sibling packages 的源码（`src`），享受毫秒级热更新，而无需每次修改底包都执行 `build`。
- **TypeScript 引用**：配置根目录 `tsconfig.json` 的 `references` 和 `paths`，实现跨包的类型跳转和智能提示。

---

## 🏆 R - 结果 (Result)

通过本次重构，项目架构从“逻辑分层”进化为“物理分包”：

1.  **包结构清晰化**：
    - `src/` 目录被成功清空。项目拆分为 5 个独立的 npm 包 (`editor`, `renderer`, `materials`, `schema`, `code-generator`)。
2.  **依赖边界确立**：
    - `code-generator` 包的 `package.json` 中不再包含 `react` 或 `dom` 相关依赖，验证了其纯逻辑性。
    - `renderer` 包成功剥离了编辑器重型依赖。
3.  **自动化能力无损迁移**：
    - 原有的 Antd 元数据自动生成和物料自动注册功能，在 Monorepo 架构下依然完美运行，证明了重构的平滑性。
4.  **为未来铺路**：
    - 现在的架构直接支持了后续的 **Iframe 隔离预览**（Branch 2）和 **服务端出码**（Branch 3）需求，这在原有的单体架构下是极难实现的。

---

## 💡 面试 Q&A 准备

**Q: 为什么重构中要把 types 单独抽一个包？**
**A:** 在单体项目中，类型定义通常散落在各处。一旦分包，如果 A 包依赖 B 包的类型，B 包又依赖 A 包的组件，就会形成循环依赖。提取 `@lowcode/schema` 作为最底层的“原子包”，是解开这种死锁最标准、最有效的方法。

**Q: 你的 Renderer 包现在体积多少？**
**A:** 目前 `packages/renderer` 仅包含最核心的递归渲染逻辑，不包含任何第三方重型库。虽然尚未针对构建产物进行极致压缩（Next Step），但从依赖树上看，它已经剔除了 Editor 中最大的体积贡献者（Monaco Editor, Prettier, Parsers 等），理论上具备了显著的体积优势。
