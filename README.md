# 轻量级低代码编辑器 (Low-Code Editor)

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blueviolet" alt="TypeScript">
  <img src="https://img.shields.io/badge/Zustand-5.0-orange" alt="Zustand">
  <img src="https://img.shields.io/badge/Vite-6.3-green" alt="Vite">
  <img src="https://img.shields.io/badge/React%20DND-16-purple" alt="React DND">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

<p align="center">
  <strong>一款基于 React + TypeScript 技术栈构建的、高度可扩展的低代码（Low-Code）编辑器。</strong>
</p>

<p align="center">
  它旨在提供一个直观的可视化界面，让用户通过<strong>拖拽组件、配置属性</strong>的方式，快速搭建出功能丰富的 Web 应用原型。
  <br>
  项目的核心设计思想是<strong>配置驱动 UI</strong>，并将编辑时逻辑与运行时逻辑完全分离，确保了最终产物的纯净与高性能。
</p>

## 🚀 核心特性与亮点

### 💡 技术亮点

- **🏗️ `dev/prod` 分离架构** - 每个物料都包含开发时 (`dev.tsx`) 和生产时 (`prod.tsx`) 两个版本，将编辑器逻辑与业务逻辑彻底解耦，确保最终渲染性能。
- **🔄 “反向注册”拖放机制** - 容器组件的放置逻辑 (`useDrop`) 能动态识别所有可以放入自身的子物料，无需硬编码，实现高度解耦和扩展。
- **✨ 自动化物料注册** - 利用 Vite 的 `import.meta.glob` 特性，新增物料无需修改任何核心代码，系统即可自动发现并集成。
- **🤖 antd 组件元数据自动生成** - 新增脚本可自动扫描 antd 组件并生成基础 `meta` 配置文件，极大提升了物料扩展效率。
- **🕰️ Temporal 时间旅行** - 通过 Zustand 的 `temporal` 中间件，非侵入式地为核心状态提供完整的撤销/重做能力。
- **📦 模块化出码引擎** - “导出源码”功能深度参考 `alibaba/lowcode-engine` 的流水线(Pipeline)架构。该引擎通过 `parser` -> `generator` -> `plugins` -> `postprocessor` -> `publisher` 的模块化流程，将页面 Schema 转换为一个完整、可独立运行的 React + Vite 项目。
- **💾 状态持久化** - 编辑器核心状态（组件树等）会自动保存到 `localStorage`，刷新页面不丢失工作进度。

### 🎨 编辑器体验

- **🖱️ 可视化拖拽** - 支持从物料区将组件拖拽到画布任意容器中，所见即所得。
- **⚙️ 动态配置面板** - 选中画布组件后，可在右侧面板动态修改其**属性 (Props)**、**样式 (Styles)** 和 **事件 (Events)**。
- **👁️ 实时预览** - 编辑器与预览模式一键切换，真实还原最终页面效果。
- **🌳 组件树大纲** - 清晰展示页面组件的层级关系，支持点击定位和**拖拽排序**。
- **⌨️ 完整的编辑体验** - 支持**撤销/重做**、**复制/粘贴/删除**等标准快捷键，极大提升编辑效率。
- **🗺️ 组件层级面包屑** - 在设置面板顶部提供清晰的父子组件导航，方便快速切换选中目标。
- **🖼️ 画布辅助功能** - **选中遮罩**提供父子级导航和快捷操作，**悬浮提示**实时显示组件信息。
- **⚡ 事件编排系统** - 支持为组件事件（如 `onClick`）绑定多种动作，如“调用其他组件方法”（支持传参）、“弹出消息”等，实现了组件间的联动。

## 📱 功能展示

### ✅ 编辑器核心模块

| 模块            | 功能特性                                               | 技术实现                                                 |
| :-------------- | :----------------------------------------------------- | :------------------------------------------------------- |
| **🎨 画布区域** | 递归渲染组件树，事件委托，悬浮/选中遮罩                | `React.createElement` + `Suspense` + `data-component-id` |
| **⚙️ 设置面板** | 属性、样式、事件分栏，根据物料 `meta` 动态生成配置表单 | `Segmented` + `Antd Form` + `Monaco Editor`              |
| **🧩 物料面板** | 展示所有可用物料，提供组件大纲树和源码视图             | `Tree` + `Monaco Editor` + `React-DND`                   |
| **📦 状态管理** | 组件树的增删改查、移动、复制粘贴、撤销重做             | `Zustand` + `immer` + `persist` + `temporal` 中间件      |

### ✅ 物料系统核心

| 模块           | 描述                                                                                                | 技术实现                                    |
| -------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **组件定义**   | 每个组件包含 `dev`、`prod`、`meta` 三个文件，实现编辑器逻辑和业务逻辑的彻底分离。                   | `React.lazy` 懒加载                         |
| **自动化注册** | 无需手动维护物料列表，系统通过文件约定自动扫描并注册所有物料。                                      | `import.meta.glob`                          |
| **元数据生成** | 新增 `gen:antd` 脚本，可自动分析 Antd 组件的 Props 并生成 `meta.tsx` 配置文件，简化新物料引入流程。 |                                             |
| **拖放逻辑**   | 子物料通过 `parentTypes` 声明可被哪些容器接受，实现“反向注册”的高度解耦模式。                       | `React-DND` + 自定义 `useMaterailDrop` Hook |

### ✅ 出码模块 (Code Generation)

| **模块**           | **功能特性**                                                                                                                                                                       | **技术实现**                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **⚙️ 出码流水线**  | 将编辑器 Schema 转换为一个**完整、可独立运行**的 React + Vite 项目。                                                                                                               | **解析 (Parser)** -> **中间表示 (IR)** -> **插件 (Plugins)** -> **后处理 (Postprocessor)** -> **发布 (Publisher)** |
| **解析 (Parser)**  | 将编辑器的组件树 Schema 转换为与框架无关的**中间表示 (IR)**。                                                                                                                      | `SchemaParser` 遍历 Schema，`component-metadata.ts` 提供组件映射。                                                 |
| **插件 (Plugins)** | **组件插件** (`jsx.ts`, `css.ts`) 负责生成 TSX 和 CSS Modules；<br /> **工程插件** (`router.ts`, `package-json.ts` 等) 负责生成路由、`package.json`、`vite.config.ts` 等工程文件。 | 模块化插件设计，参考 `alibaba/lowcode-engine` 的 `solutions` 思想。                                                |
| **后处理 & 发布**  | **代码格式化**：自动调用 Prettier 格式化所有生成的代码文件。 <br />**打包发布**：将所有内存中的文件打包为 `Zip` 压缩包，支持一键下载 或在 CodeSandbox 中打开。                     | `ProjectBuilder` 应用 `prettierPostProcessor`； `zipPublisher` 生成 Blob。                                         |

## 🛠️ 技术栈

### 核心框架与状态管理

```typescript
"react": "^18.2.0",       // 用于构建用户界面的 JavaScript 库
"typescript": "~5.8.3",   // 为 JavaScript 添加了类型系统
"zustand": "^5.0.5",      // 轻量、灵活的 React 状态管理库
"immer": "^10.1.1",       // 支持以可变方式编写不可变更新
"zundo": "^2.3.0"         // 为 Zustand 状态提供撤销/重做功能
```

### UI 与交互

```ts
"antd": "^5.25.3",                     // 企业级 UI 设计语言和 React UI 库
"allotment": "^1.20.3",                // 可拖拽调整大小的 React 面板组件
"react-dnd": "^16.0.1",                // 用于构建复杂拖放界面的 React 工具集
"react-dnd-html5-backend": "^16.0.1",  // React-DND 的官方 HTML5 拖放后端
"tailwindcss": "^4.1.11"               // 一个功能优先的 CSS 框架
```

### 工程化与构建

```ts
"vite": "^6.3.5",                         // 新一代前端开发与构建工具
"@vitejs/plugin-react": "^4.4.1",         // 为 Vite 提供 React 支持
"tsx": "^4.20.3",                         // 使用 TypeScript 无缝执行 Node.js 脚本
"react-docgen-typescript": "^2.4.0",      // 用于解析 TS React 组件的 props
"monaco-editor": "^0.52.2",               // 驱动 VS Code 的代码编辑器
"@monaco-editor/react": "^4.7.0"          // Monaco Editor 的 React 封装
```

## 🏗️ 架构详解

### 目录结构

本项目的核心逻辑均在 `src/` 目录下：

```
src/
├── editor/             # 编辑器核心模块：负责UI渲染和交互。
│   ├── components/     # 编辑器自身UI组件（如画布、面板）。
│   │   ├── EditArea/   # 主画布区域。
│   │   ├── Header/     # 顶部操作栏。
│   │   ├── Setting/    # 右侧设置面板（属性、样式）。
│   │   └── ...
│   │
│   ├── hooks/          # 可复用的自定义 Hooks。
│   │   ├── useMatrialDrop.ts    # 物料拖拽放置逻辑。
│   │   ├── useShortcutKeys.ts   # 全局快捷键管理。
│   │   └── useStyleChangeHandler.ts # 样式变更处理器。
│   │
│   ├── materials/      # ⭐ 可拖拽的“物料”组件定义。
│   │   ├── Button/
│   │   │   ├── dev.tsx      # 开发时版本（编辑器内用）。
│   │   │   ├── prod.tsx     # 生产时版本（预览/生成代码用）。
│   │   │   └── meta.tsx     # 物料元数据配置（核心）。
│   │   └── index.tsx        # 物料自动化注册中心。
│   │
│   └── stores/         # ⭐ 全局状态管理中心（基于 Zustand）。
│       ├── components.tsx     # 负责管理画布中的组件树结构（Schema数据源）。
│       └── component-config.tsx # 物料注册中心，存放物料元数据。
│
└── code-generator/     # ⭐ 源码导出模块：将Schema转换为代码。
    ├── const/          # 出码相关的常量定义。
    │   └── component-metadata.ts # 组件在出码时的元数据（依赖、代码生成提示等）。
    │
    ├── generator/      # 代码构建器（将IR抽象转换为代码文件）。
    │   ├── module-builder.ts  # 模块构建器（管理单个文件，如imports, methods, jsx）。
    │   └── project-builder.ts # 项目构建器（管理所有文件，应用后处理器）。
    │
    ├── parser/         # Schema 解析器（将 Schema 转换为 IR）。
    │   ├── component-handlers.ts # 特定组件（如FormItem）的Schema->IR转换处理器。
    │   ├── component-metadata.ts # Schema组件名到IR组件元数据的映射。
    │   └── schema-parser.ts   # Schema解析器主类，执行Schema -> IRProject的转换。
    │
    ├── plugins/        # 代码生成流水线插件。
    │   ├── component/      # 组件级别插件（操作单个IRNode）。
    │   │   ├── react/        # React (JSX) 相关插件。
    │   │   │   ├── handlers/   # 特定功能的处理器。
    │   │   │   └── jsx.ts        # 核心插件：将 IRNode 转换为 JSX 字符串。
    │   │   └── style/        # 样式相关插件。
    │   └── project/        # 项目级别插件（操作ProjectBuilder）。
    │
    ├── postprocessor/  # 后处理器（对已生成的代码文件进行处理）。
    │   └── prettier.ts   # Prettier 插件：格式化所有生成的代码。
    │
    ├── publisher/      # 发布器（将内存中的文件发布为产物）。
    │   └── zip-publisher.ts # ZIP 插件：将所有文件打包为 zip 压缩包。
    │
    ├── solutions/      # 解决方案/项目模板（定义完整的流水线）。
    │   └── react-vite.ts # React + Vite 解决方案：串联所有插件。
    │
    ├── types/          # 类型定义。
    │   ├── ir.ts         # ⭐ 核心：中间表示 (IR) 的类型定义。
    │   ├── plugin.ts     # 插件 (IComponentPlugin, IProjectPlugin) 的类型定义。
    │   └── publisher.ts  # 发布器 (IPublisher) 的类型定义。
    │
    ├── utils/          # 出码相关的工具函数。
    │   └── download.ts   # 浏览器端下载 Blob 的辅助函数。
    │
    ├── README.md       # 出码模块的说明文档。
    └── index.ts        # 导出功能主入口 (exportSourceCode)。
```

### 状态管理 (Zustand)

使用 Zustand 以一种极其简洁的方式管理着复杂的组件树状态。它巧妙地组合了多个中间件：

```tsx
// file: /src/editor/stores/components.tsx

// 1. 使用 `immer` 中间件，可以直接修改 state
export const useComponetsStore = create<EditorStore>()(
  // 3. 最外层包裹 `temporal`，为整个 store 增加撤销/重做能力
  temporal(
    // 2. 包裹 `persist`，将状态持久化到 localStorage
    persist(immer(creator), { name: "lowcode-store" }),
    {
      // 仅追踪对核心 `components` 树的修改，避免 UI 状态污染历史栈
      partialize: (state) => ({ components: state.components }),
    }
  )
);
```

### 自动化物料系统

项目实现了一套强大的自动化物料系统，它结合了**约定式文件扫描**和**脚本化元数据生成**，实现了新增物料的“零配置”接入。

**核心流程：**

1. **元数据自动生成 (针对 Antd)**：
   - 项目新增了一个脚本 `scripts/gen-antd-metas.ts`，它使用 `react-docgen-typescript` 库来静态分析 Ant Design 组件的 `Props` 类型。
   - 在 `npm run dev` 或 `npm run build` 时，该脚本会自动执行（通过 `predev` 和 `prebuild` 钩子），为 `component-map.ts` 中列出的所有 antd 组件生成基础的 `meta.tsx` 配置文件，并输出到 `src/editor/materials/_generated` 目录。
   - 这极大地减少了引入新 antd 物料时所需的手动配置工作。
2. **智能合并与动态加载**：
   - 物料注册中心 (`src/editor/materials/index.tsx`) 会同时扫描**手写的物料**和**自动生成的物料**。
   - 系统采用**智能合并策略**：如果一个物料同时存在手写和自动生成的 `meta` 文件，系统会**优先使用手写的配置**，并用自动生成的配置来**补全**缺失的属性（如 `setter`, `events` 等）。这既保证了自动化的高效，又保留了手动定制的灵活性。
   - 最后，系统利用 Vite 的 `import.meta.glob` 动态匹配所有 `dev.tsx` 和 `prod.tsx` 文件，并通过 `React.lazy` 进行懒加载，最终形成完整的物料库。

```TypeScript
// file: /src/editor/materials/index.tsx

// 1. 同步、急切地导入所有 "手写" meta.tsx
const manualMetas = import.meta.glob("./**/meta.tsx", {
  eager: true,
  import: "default",
});

// 2. 异步、懒加载地导入所有 dev/prod 组件
const devComponents = import.meta.glob<LazyComponentModule>("./**/dev.tsx");
const prodComponents = import.meta.glob<LazyComponentModule>("./**/prod.tsx");

// 3. 同步导入所有 "自动生成" 的 meta
import * as autoGeneratedMetas from "./_generated";

// 4. 将 "手写" 和 "自动生成" 的 meta 列表进行智能合并
//    - 手写配置优先级更高
//    - 自动生成的配置用于补全
//    - 最终将所有 meta 与对应的 dev/prod 组件关联起来
const mergedList = mergeStrategies(manualMetas, autoGeneratedMetas);

// 5. 最终导出的 materials 数组
export const materials: ComponentConfig[] = buildFromMergedList(
  mergedList,
  devComponents,
  prodComponents
);
```

### 解耦的拖放机制

拖放逻辑采用“反向注册”模式。容器组件不再硬编码它能接受哪些子组件，而是由子组件在其 `meta.tsx` 中通过 `parentTypes` 属性“声明”自己能被哪些容器接受。这使得组件间的关系高度解耦，扩展性极强。

```tsx
// file: /src/editor/hooks/useMatrialDrop.ts

export function useMaterailDrop(containerId: number, containerName: string) {
  const { componentConfig } = useComponentConfigStore();

  // 核心解耦逻辑：动态计算可接受的子组件类型列表
  const accept = Object.values(componentConfig)
    .filter((config) => config.parentTypes?.includes(containerName))
    .map((config) => config.name);

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept, // 使用动态计算出的 accept 列表
    // ... drop 逻辑
  }));

  return { drop, isOver };
}
```

### 源码导出流水线 (Code Generation)

项目实现了一套受 `alibaba/lowcode-engine` 启发的模块化出码流水线，位于 `src/code-generator/` 目录，能够将编辑器中的 Schema 转换为一个独立可运行的 React + Vite 项目。

**核心流程：**

1. **Schema 解析 (Parser)**：
   - `SchemaParser` 负责将编辑器的 JSON Schema 转换为内部统一的**中间表示（Intermediate Representation, IR）**。
   - 此 IR 结构（定义于 `types/ir.ts`）解耦了上层 Schema 和下层代码生成逻辑，并包含了节点、属性、依赖等关键信息。
2. **解决方案 (Solution)**：
   - `react-vite.ts` 作为核心解决方案，定义了完整的代码生成**流水线 (Pipeline)**。
3. **插件化执行 (Plugins)**：
   - **组件插件 (Component Plugins)**：如 `jsx.ts` 和 `css.ts`，遍历 IR 树，为每个组件节点生成对应的 `.tsx` (JSX) 和 `.module.scss` (CSS Modules) 代码。
   - **项目插件 (Project Plugins)**：负责生成项目级文件，如 `package.json`、`vite.config.ts`、`index.html` 和路由配置等。
4. **代码构建 (Builder)**：
   - `ProjectBuilder` 用于管理整个项目的文件结构。
   - `ModuleBuilder` 负责构建单个文件（如 React 组件），智能处理 `import` 语句、React Hooks 和事件处理函数（Actions）的生成。
5. **后处理 (Post-processor)**：
   - 在文件生成后，自动调用 `prettier` 对所有代码进行格式化，确保产物可读性。
6. **发布 (Publisher)**：
   - `zipPublisher` 使用 `JSZip` 将所有生成的代码文件打包成一个 `.zip` 压缩包，供用户下载。

## 📈 项目路线图 (Roadmap)

本项目有清晰的功能迭代计划，旨在从一个核心编辑器原型，逐步完善为一个功能强大、体验优秀、具备扩展性的低代码解决方案。

- **第一阶段：核心体验与高频功能完善** (✅ 已完成)
  - [x] 实现撤销/重做
  - [x] 实现组件的复制 / 粘贴 / 删除
  - [x] 大纲树支持拖拽调整层级和顺序
- **第二阶段：高级功能与生态建设** (✅ 已完成)
  - [x] 编辑器专业功能增强（高级样式）
  - [x] 引入高级布局与业务组件（栅格、Tabs、图表）
- **第三阶段：打通数据与逻辑** (规划中)
  - [ ] 引入全局状态与数据源管理
  - [ ] 实现强大的数据绑定与条件/列表渲染
- **第四阶段：工程化与产物** (✅ 已完成)
  - [x] 页面 Schema 的导入/导出
  - [x] 出码与独立发布

更多细节请查看 [ROADMAP.md](https://github.com/xxMudCloudxx/lowcode-editor/blob/main/ROADMAP.md) 文件。

## 🏁 快速开始 (Getting Started)

遵从以下步骤即可在本地运行此项目。

1. **克隆仓库**

   ```bash
   git clone git@github.com:xxMudCloudxx/lowcode-editor.git
   cd lowcode-editor
   ```

2. **安装依赖**

   ```bash
   npm install
   # 或者 yarn install, pnpm install
   ```

3. **运行项目**

   ```bash
   npm run dev
   ```

   项目将在本地启动，你可以通过浏览器访问对应的地址（如 `http://localhost:5173`）。

## 🤝 如何贡献 (How to Contribute)

我们非常欢迎各种形式的贡献！无论是代码实现、功能建议还是文档完善。

- **物料开发**: 如果你想为项目贡献一个新的可拖拽组件，请务必阅读我们的 [物料组件开发规范](https://github.com/xxMudCloudxx/lowcode-editor/blob/main/src/editor/materials/README.md)，它会指导你如何遵循项目的设计模式来创建新的物料。
- **提交问题**: 如果你发现了 Bug 或者有任何建议，欢迎通过 [Issues](https://github.com/xxMudCloudxx/lowcode-editor/issues) 提出。

## 🙏 致谢

- **初始学习与启发**: 本项目在初始阶段深度参考并跟随了稀土掘金小册[《React 通关秘籍》](https://juejin.cn/book/7294082310658326565)中的实战章节。在此，特别感谢作者 **zxg\_神说要有光** 提供的优质内容，为本项目的架构设计奠定了坚实的基础。
- **开源社区**: 感谢 Vite、React、Zustand、Ant Design 以及所有本项目使用到的开源项目的贡献者们。

## 📜 许可证 (License)

本项目采用 [MIT](https://github.com/xxMudCloudxx/lowcode-editor/blob/main/LICENSE) 许可。

```
MIT License

Copyright (c) 2025 xxMudCloudxx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！

<p align="center">
<img src=https://img.shields.io/github/stars/xxMudCloudxx/lowcode-editor?style=social alt="GitHub stars">
<img src=https://img.shields.io/github/forks/xxMudCloudxx/lowcode-editor?style=social alt="GitHub forks">
<img src=https://img.shields.io/github/watchers/xxMudCloudxx/lowcode-editor?style=social alt="GitHub watchers">
</p>
