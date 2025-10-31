# Lowcode-Editor 出码模块 (Code Generator) 设计文档

## 1. 概览

本模块负责将 `lowcode-editor` 的 JSON Schema 转换为一个可独立运行的、基于 React + Vite 的前端项目。

## 2. 核心架构：流水线 (Pipeline)

我们参考 `alibaba/lowcode-engine` 的出码方案，采用“解析-生成-发布”的流水线架构：

`Editor Schema` -> **[Parser]** -> `IR (中间表示)` -> **[Generator Plugins]** -> `代码文件 (内存中)` -> **[Postprocessor]** -> `格式化代码` -> **[Publisher]** -> `Zip 压缩包 / 磁盘文件`

## 3. 核心概念

### 3.1. 中间表示 (IR - Intermediate Representation)

IR 是解耦“解析”和“生成”的关键。它是一种与具体 Schema 和目标框架无关的中间数据结构。
(详见: `src/code-generator/types/ir.ts`)

### 3.2. 组件元数据 (Component Metadata)

这是 Schema 组件名和真实 NPM 包组件之间的“映射字典”。
(详见: `src/code-generator/const/component-metadata.ts`)

## 4. 模块职责划分

- `/types`: 存放 IR 和 Schema 的 TypeScript 类型定义。
- `/const`: 存放核心常量，如 `componentMetadataMap`。
- `/parser`: 负责将 Editor Schema 解析为 IR。
- `/generator`: 存放代码构建器 (`ModuleBuilder`, `ProjectBuilder`)。
- `/plugins`: 存放所有代码生成插件（如 JSX 插件、CSS 插件、package.json 插件）。
- `/solutions`: 负责编排和组织插件，定义特定技术栈（如 `react-vite`）的流水线。
- `/postprocessor`: (待实现) 存放后处理器，如 Prettier 代码格式化。
- `/publisher`: (待实现) 存放发布器，如生成 Zip 包。
- `index.ts`: 模块统一入口，提供 `exportSourceCode` API。

## 5. 功能实现路线图 (Roadmap)

### ☑ 阶段一：核心骨架 (已完成)

- [x] 搭建 `Parser` -> `IR` -> `Plugin` -> `Generator` 核心流水线。
- [x] 实现单页面 TSX 组件代码生成 (`jsx.ts`)。
- [x] 实现 `ModuleBuilder` 管理 `import` 语句。
- [x] 在编辑器中集成调用，完成端到端测试。

### ☐ 阶段二：功能完善 (进行中)

- [x] **样式处理:** 实现 `plugins/component/style/css.ts`，将 `styles` 抽离为 CSS Modules 或 CSS-in-JS。
- [x] **高级属性解析:** 完善 `schema-parser.ts` 和 `jsx.ts`，支持 `JSExpression` (表达式)、`JSFunction` (函数) 和 `IRAction` (动作)。
- [x] **Icon 组件:** 专项处理 `Icon` 组件，根据 `props.name` 动态从 `@ant-design/icons` 导入。
- [ ] **全局文件:**
  - [x] `plugins/project/globalStyle.ts` (生成 `global.css`)。
  - [ ] `plugins/project/utils.ts` (生成 `src/utils/index.ts`，如果 Schema 中有全局函数)。

### ☐ 阶段三：工程化 (待办)

- [ ] **依赖生成:** `plugins/project/packageJSON.ts` (根据 `IRProject.dependencies` 生成 `package.json`)。
- [ ] **构建配置:** `plugins/project/viteConfig.ts` (生成 `vite.config.ts`, `tsconfig.json`)。
- [ ] **入口文件:** `plugins/project/entry.ts` (生成 `index.html` 和 `src/main.tsx`)。
- [ ] **发布器:** `publisher/zip/index.ts` (实现 Zip 压缩包下载功能)。

### ☐ 阶段四：高级功能与优化 (待办)

- [ ] **代码格式化:** `postprocessor/prettier/index.ts` (集成 Prettier 自动格式化生成的代码)。
- [ ] **多页面支持:**
  - [ ] `plugins/project/router.ts` (生成 `react-router` 路由配置)。
  - [ ] `schema-parser.ts` 改造，支持解析多页面 Schema。
- [ ] **状态管理:** (可选) 支持 Zustand 或 Redux 的全局状态生成。
