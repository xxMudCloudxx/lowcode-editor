// src/code-generator/plugins/project/index.ts

/**
 * @file 项目级出码插件入口
 * @description 汇总并导出所有项目级插件（样式、路由、入口文件、配置等），由解决方案统一执行。
 *
 * 注意：5 个静态模板文件（tsconfig、vite-config、gitignore、index-html、vite-env）
 * 已迁移到 ReactViteTemplate，不再作为独立插件。
 */

import globalStylePlugin from "./global-style";
import routerPlugin from "./router";
import entryPlugin from "./entry";
import packageJsonPlugin from "./package-json";
import componentsPlugin from "./components";

export const projectPlugins = [
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  componentsPlugin,
];

export {
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  componentsPlugin,
};
