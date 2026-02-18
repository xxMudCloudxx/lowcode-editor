// src/code-generator/plugins/project/index.ts

/**
 * @file 项目级出码插件入口
 * @description 汇总并导出所有项目级插件（样式、路由、入口文件、配置等），由解决方案统一执行。
 */

import globalStylePlugin from "./global-style";
import routerPlugin from "./router";
import entryPlugin from "./entry";
import packageJsonPlugin from "./package-json";
import viteConfigPlugin from "./vite-config";
import tsConfigPlugin from "./tsconfig";
import gitignorePlugin from "./gitignore";
import indexHtmlPlugin from "./index-html";
import viteEnvPlugin from "./vite-env";
import componentsPlugin from "./components";
// 以后还会有 utilsPlugin, packageJsonPlugin 等

export const projectPlugins = [
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  viteConfigPlugin,
  tsConfigPlugin,
  gitignorePlugin,
  indexHtmlPlugin,
  viteEnvPlugin,
  componentsPlugin,
  // ...
];

export { globalStylePlugin, routerPlugin, entryPlugin };
