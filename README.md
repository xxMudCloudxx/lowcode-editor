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
- ** Temporal 时间旅行** - 通过 Zustand 的 `temporal` 中间件，非侵入式地为核心状态提供完整的撤销/重做能力。
- **💾 状态持久化** - 编辑器核心状态（组件树等）会自动保存到 `localStorage`，刷新页面不丢失工作进度。

### 🎨 编辑器体验

- **🖱️ 可视化拖拽** - 支持从物料区将组件拖拽到画布任意容器中，所见即所得。
- **⚙️ 动态配置面板** - 选中画布组件后，可在右侧面板动态修改其**属性 (Props)**、**样式 (Styles)** 和 **事件 (Events)**。
- **👁️ 实时预览** - 编辑器与预览模式一键切换，真实还原最终页面效果。
- **🌳 组件树大纲** - 清晰展示页面组件的层级关系，支持点击定位和**拖拽排序**。
- **⌨️ 完整的编辑体验** - 支持**撤销/重做**、**复制/粘贴/删除**等标准快捷键，极大提升编辑效率。
- **🖼️ 画布辅助功能** - **选中遮罩**提供父子级导航和快捷操作，**悬浮提示**实时显示组件信息。

## 📱 功能展示

### ✅ 编辑器核心模块

| 模块 | 功能特性 | 技术实现 |
| :--- | :--- | :--- |
| **🎨 画布区域** | 递归渲染组件树，事件委托，悬浮/选中遮罩 | `React.createElement` + `Suspense` + `data-component-id` |
| **⚙️ 设置面板** | 属性、样式、事件分栏，根据物料 `meta` 动态生成配置表单 | `Segmented` + `Antd Form` + `Monaco Editor` |
| **🧩 物料面板** | 展示所有可用物料，提供组件大纲树和源码视图 | `Tree` + `Monaco Editor` + `React-DND` |
| **📦 状态管理** | 组件树的增删改查、移动、复制粘贴、撤销重做 | `Zustand` + `immer` + `persist` + `temporal` 中间件 |

### ✅ 物料系统核心

| 模块 | 描述 | 技术实现 |
| :--- | :--- | :--- |
| **组件定义** | 每个组件包含 `dev`、`prod`、`meta` 三个文件，实现编辑器逻辑和业务逻辑的彻底分离。 | `React.lazy` 懒加载 |
| **自动化注册** | 无需手动维护物料列表，系统通过文件约定自动扫描并注册所有物料。 | `import.meta.glob` |
| **拖放逻辑** | 子物料通过 `parentTypes` 声明可被哪些容器接受，实现“反向注册”的高度解耦模式。 | `React-DND` + 自定义 `useMaterailDrop` Hook |

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
"monaco-editor": "^0.52.2",               // 驱动 VS Code 的代码编辑器
"@monaco-editor/react": "^4.7.0"          // Monaco Editor 的 React 封装
```



## 🏗️ 架构详解

### 目录结构

本项目的核心逻辑均在 `src/editor` 目录下：

```
src/editor/
├── components/   # 编辑器自身的核心UI组件 (如画布、属性面板、遮罩层)
│   ├── EditArea/ # 编辑器主画布区域
│   ├── Header/   # 顶部操作栏
│   ├── Setting/  # 右侧设置面板 (属性、样式、事件)
│   └── ...
│
├── hooks/        # 可复用的自定义 Hooks
│   ├── useMatrialDrop.ts     # 封装了核心的“反向注册”放置逻辑
│   ├── useShortcutKeys.ts    # 全局快捷键管理
│   └── useStyleChangeHandler.ts # 样式变更处理器工厂
│
├── materials/    # ⭐ 所有可拖拽的“物料”组件 (核心设计)
│   ├── Button/
│   │   ├── dev.tsx      # 开发时版本 (用于编辑器)
│   │   ├── prod.tsx     # 生产时版本 (用于预览)
│   │   └── meta.tsx     # 物料的元数据配置 (核心)
│   └── index.tsx      # ⭐ 物料自动化注册中心
│
└── stores/       # ⭐ 全局状态管理中心 (基于 Zustand)
    ├── components.tsx       # 负责管理画布中的组件树、当前选中组件等核心数据
    └── component-config.tsx # “物料注册中心”，定义了所有物料的元数据和配置
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
    persist(
      immer(creator), 
      { name: "lowcode-store" }
    ),
    { 
      // 仅追踪对核心 `components` 树的修改，避免 UI 状态污染历史栈
      partialize: (state) => ({ components: state.components })
    }
  )
);
```



### 自动化物料系统

项目利用 Vite 的 `import.meta.glob` 特性，实现了物料的自动化注册。新增一个物料只需创建对应的文件夹和文件，无需修改任何现有代码。

```tsx
// file: /src/editor/materials/index.tsx

// 同步、急切地导入所有 meta.tsx 文件，获取元数据
const metas = import.meta.glob("./**/meta.tsx", {
  eager: true,
  import: "default",
});

// 异步、懒加载地导入所有 dev.tsx 和 prod.tsx 组件
const devComponents = import.meta.glob<LazyComponentModule>("./**/dev.tsx");
const prodComponents = import.meta.glob<LazyComponentModule>("./**/prod.tsx");

// 遍历 metas，动态组装每个物料的完整配置
export const materials: ComponentConfig[] = Object.keys(metas).map((key) => {
  const meta = metas[key] as Omit<ComponentConfig, "dev" | "prod">;
  const path = key.replace("/meta.tsx", "");

  return {
    ...meta,
    // 使用 React.lazy 实现代码分割和按需加载
    dev: lazy(devComponents[`${path}/dev.tsx`]),
    prod: lazy(prodComponents[`${path}/prod.tsx`]),
  };
});
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



## 📈 项目路线图 (Roadmap)

本项目有清晰的功能迭代计划，旨在从一个核心编辑器原型，逐步完善为一个功能强大、体验优秀、具备扩展性的低代码解决方案。

- **第一阶段：核心体验与高频功能完善** (✅ 已完成)
  - [x] 实现撤销/重做
  - [x] 实现组件的复制 / 粘贴 / 删除
  - [x] 大纲树支持拖拽调整层级和顺序
- **第二阶段：高级功能与生态建设** (进行中)
  - [ ] 编辑器专业功能增强（高级样式、数据绑定）
  - [ ] 引入高级布局与业务组件（栅格、Tabs、图表）
- **第三阶段：打通数据与逻辑** (规划中)
  - [ ] 引入全局状态与数据源管理
  - [ ] 实现强大的数据绑定与条件/列表渲染
- **第四阶段：工程化与产物** (规划中)
  - [ ] 页面 Schema 的导入/导出
  - [ ] 出码与独立发布

更多细节请查看 [ROADMAP.md](https://www.google.com/search?q=./ROADMAP.md) 文件。



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

- **物料开发**: 如果你想为项目贡献一个新的可拖拽组件，请务必阅读我们的 [物料组件开发规范](https://www.google.com/search?q=./src/editor/materials/README.md)，它会指导你如何遵循项目的设计模式来创建新的物料。
- **提交问题**: 如果你发现了 Bug 或者有任何建议，欢迎通过 [Issues](https://www.google.com/search?q=https://github.com/xxMudCloudxx/lowcode-editor/issues) 提出。



## 🙏 致谢

- **初始学习与启发**: 本项目在初始阶段深度参考并跟随了稀土掘金小册[《React 通关秘籍》](https://juejin.cn/book/7294082310658326565)中的实战章节。在此，特别感谢作者 **zxg_神说要有光** 提供的优质内容，为本项目的架构设计奠定了坚实的基础。
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



------



⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
<p align="center">
<img src=https://img.shields.io/github/stars/xxMudCloudxx/lowcode-editor?style=social alt="GitHub stars">
<img src=https://img.shields.io/github/forks/xxMudCloudxx/lowcode-editor?style=social alt="GitHub forks">
<img src=https://img.shields.io/github/watchers/xxMudCloudxx/lowcode-editor?style=social alt="GitHub watchers">
</p>
