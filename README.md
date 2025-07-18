# 轻量级低代码编辑器 (Low-Code Editor)

## 简介 (Introduction)

这是一款基于 **React + TypeScript** 技术栈构建的、高度可扩展的**低代码（Low-Code）编辑器**。它旨在提供一个直观的可视化界面，让用户通过**拖拽组件、配置属性**的方式，快速搭建出功能丰富的 Web 应用原型。

项目的核心设计思想是**配置驱动 UI**，并将编辑时逻辑与运行时逻辑完全分离，确保了最终产物的纯净与高性能。

_(项目界面的 GIF 动态图占位处)_

## ✨ 核心功能 (Core Features)

- **可视化拖拽**: 支持从物料区将组件拖拽到画布任意容器中。
- **组件动态配置**: 选中画布中的组件后，可在右侧设置面板中动态修改其**属性 (Props)**、**样式 (Styles)** 和 **事件 (Events)**。
- **实时预览**: 编辑器与预览模式一键切换，所见即所得。
- **画布辅助功能**:
  - **选中遮罩**: 清晰地高亮当前选中的组件，并提供父子级面包屑导航和复制、粘贴、删除等快捷操作。
  - **悬浮提示**: 鼠标悬浮时显示组件信息。
- **组件树大纲**:
  - 以树状结构清晰展示页面所有组件的层级关系。
  - 支持点击节点定位到画布中的对应组件。
  - **支持拖拽节点，直接调整组件的层级和顺序**。
- **完整的编辑体验**:
  - **撤销/重做**: 安全地回退或重做每一步操作。
  - **复制/粘贴/删除**: 支持标准快捷键 (`Cmd/Ctrl + C/V/Delete`)，极大提升编辑效率。
- **源码面板**: 实时展示当前页面组件树的 JSON Schema 数据结构。
- **状态持久化**: 编辑器状态（组件树等）会自动保存到 `localStorage`，刷新页面不丢失。
- **高度解耦的物料系统**:
  - **`dev/prod` 分离**: 每个物料都包含开发时 (`dev.tsx`) 和生产时 (`prod.tsx`) 两个版本，将编辑器逻辑与业务逻辑彻底解耦。
  - **“反向注册”的拖放机制**: 容器组件的放置逻辑 (`useDrop`) 能动态识别所有可以放入自身的子物料，无需硬编码。

## 🚀 技术栈 (Tech Stack)

- **构建工具**: [Vite](https://vitejs.dev/)
- **核心框架**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand) (组合 `immer`, `persist`, `temporal` 中间件)
- **拖拽实现**: [React-DND](https://react-dnd.github.io/react-dnd/about)
- **UI 组件库**: [Ant Design](https://ant.design/)
- **布局与样式**: [Tailwind CSS](https://tailwindcss.com/) + 内联样式
- **代码编辑器**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **可伸缩面板**: [Allotment](https://github.com/johnsoncodehk/allotment)

## 🏗️ 项目结构解析

一个好的目录结构可以帮助开发者快速找到他们需要的信息。本项目的核心逻辑均在 `src/editor` 目录下：

```
src/editor/
├── components/   # 编辑器自身的核心UI组件 (如画布、属性面板、遮罩层)
│   ├── EditArea/ # 编辑器主画布区域
│   ├── Header/   # 顶部操作栏
│   ├── Setting/  # 右侧设置面板 (属性、样式、事件)
│   └── ...
│
├── hooks/        # 可复用的自定义 Hooks
│   └── useMatrialDrop.ts # 封装了核心的放置逻辑
│
├── materials/    # ⭐ 所有可拖拽的“物料”组件
│   ├── Button/
│   │   ├── dev.tsx      # 开发时版本 (用于编辑器)
│   │   ├── prod.tsx     # 生产时版本 (用于预览)
│   │   └── meta.tsx     # 物料的元数据配置 (核心)
│   └── ...
│
└── stores/       # ⭐ 全局状态管理中心 (基于 Zustand)
    ├── components.tsx       # 负责管理画布中的组件树、当前选中组件等核心数据
    └── component-config.tsx # “物料注册中心”，定义了所有物料的元数据和配置
```

### ✨ 设计亮点 (Design Highlights)

- **物料系统 (`/materials`)**: 这是项目的精髓所在。每个物料都遵循 `dev` (开发时)、 `prod` (生产时) 和 `meta` (元数据) 三文件分离的模式。这种设计确保了在编辑器中我们可以为组件增加任意复杂的交互逻辑（如拖拽、高亮），而最终生成的产物则是纯粹、干净的业务组件。

- **自动化物料注册 (`/materials/index.tsx`)**: 项目利用 Vite 的 `import.meta.glob` 特性，实现了物料的**自动化注册**。新增一个物料**只需创建对应的文件夹和文件，无需修改任何现有代码**，系统便会自动发现并集成，极大地降低了物料开发的复杂度。

- **状态管理 (`/stores/components.tsx`)**: 使用 Zustand 以一种极其简洁的方式管理着复杂的组件树状态。它巧妙地组合了：

  - `immer`: 允许用可变的方式安全地更新状态。
  - `persist`: 轻松实现状态到 `localStorage` 的持久化。
  - `temporal`: 非侵入式地为状态增加了完整的**撤销/重做**（时间旅行）能力。

- **拖放机制 (`/hooks/useMatrialDrop.ts`)**: 拖放逻辑采用**“反向注册”**模式。容器组件不再硬编码它能接受哪些子组件，而是由子组件在其 `meta.tsx` 中通过 `parentTypes` 属性“声明”自己能被哪些容器接受。这使得组件间的关系高度解耦，扩展性极强。

## 🏛️ 项目背景与演进

本项目在初始阶段（`commit 450248e` 之前）深度参考并跟随了稀土掘金小册[《React 通关秘籍》](https://juejin.cn/book/7294082310658326565)中的实战章节进行学习和实现。在此，特别感谢作者 **zxg\_神说要有光** 提供的优质内容，为本项目的架构设计奠定了坚实的基础。

在完成了基础版本的学习后，后续的所有功能迭代和代码优化（`commit 450248e` 之后）均为本人独立思考和开发，例如撤销/重做、复制/粘贴、大纲树拖拽、事件编排系统重构、`SelectedMask` 交互细节的打磨等。

## 🏁 快速开始 (Getting Started)

遵从以下步骤即可在本地运行此项目。

1.  **克隆仓库**

    ```bash
    git clone git@github.com:xxMudCloudxx/lowcode-editor.git
    cd lowcode-editor
    ```

2.  **安装依赖**

    ```bash
    npm install
    # 或者 yarn install, pnpm install
    ```

3.  **运行项目**

    ```bash
    npm run dev
    ```

    项目将在本地启动，你可以通过浏览器访问对应的地址（如 `http://localhost:5173`）。

## 🤝 如何贡献 (How to Contribute)

我们非常欢迎各种形式的贡献！无论是代码实现、功能建议还是文档完善。

- **路线图 (Roadmap)**: 项目有清晰的功能迭代计划，详情请查看 [ROADMAP.md](./ROADMAP.md) 文件。你可以了解项目未来的发展方向，并选择你感兴趣的功能进行开发。
- **物料开发**: 如果你想为项目贡献一个新的可拖拽组件，请务必阅读我们的 [物料组件开发规范 (`src/editor/materials/README.md`)](./src/editor/materials/README.md)，它会指导你如何遵循项目的设计模式来创建新的物料。
- **提交问题**: 如果你发现了 Bug 或者有任何建议，欢迎通过 [Issues](https://github.com/your-username/lowcode-editor/issues) 提出。

## 📜 许可证 (License)

本项目采用 [MIT](https://opensource.org/licenses/MIT) 许可。
