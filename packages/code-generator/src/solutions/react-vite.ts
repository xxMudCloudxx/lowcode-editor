/**
 * @file React + Vite 出码解决方案
 * @description 实现 ISolution 接口，定义 React + Vite 技术栈的完整出码流水线。
 */

import type { ISolution } from "@lowcode/schema";
import { reactViteTemplate } from "../templates/react-vite-template";
import { prettierPostProcessor } from "../postprocessor/prettier";
import { zipPublisher } from "../publisher/zip-publisher";

// --- 组件级插件 ---
import jsxPlugin from "../plugins/component/react/jsx";
import cssPlugin from "../plugins/component/style/css";

// --- 项目级插件（动态文件，依赖 IR）---
import globalStylePlugin from "../plugins/project/global-style";
import routerPlugin from "../plugins/project/router";
import entryPlugin from "../plugins/project/entry";
import packageJsonPlugin from "../plugins/project/package-json";
import componentsPlugin from "../plugins/project/components";

/**
 * React + Vite 出码方案
 *
 * 编排完整的出码流水线：
 * 1. ReactViteTemplate → 静态脚手架文件（tsconfig, vite.config, .gitignore, index.html, vite-env）
 * 2. ComponentPlugins → CSS Module 提取 + React JSX 生成
 * 3. ProjectPlugins → 路由、入口、全局样式、组件桶文件、package.json
 * 4. PostProcessors → Prettier 格式化
 * 5. Publisher → ZIP 打包下载
 */
const reactViteSolution: ISolution = {
  name: "react-vite",
  description: "基于 React 18 + Vite 5 + TypeScript 的标准 SPA 项目",

  template: reactViteTemplate,

  componentPlugins: [cssPlugin, jsxPlugin],

  projectPlugins: [
    { ...globalStylePlugin, phase: "post" as const, weight: 10 },
    { ...componentsPlugin, phase: "post" as const, weight: 20 },
    { ...routerPlugin, phase: "post" as const, weight: 30 },
    { ...entryPlugin, phase: "post" as const, weight: 40 },
    { ...packageJsonPlugin, phase: "post" as const, weight: 100 }, // package.json 最后生成，以收集所有依赖
  ],

  postProcessors: [prettierPostProcessor()],

  publisher: zipPublisher,
};

export default reactViteSolution;
