/**
 * @file React 项目级出码插件入口
 * @description 汇总并导出 React 项目级插件（样式、路由、入口文件、配置等），由解决方案统一执行。
 */

import globalStylePlugin from "./global-style";
import routerPlugin from "./router";
import entryPlugin from "./entry";
import packageJsonPlugin from "./package-json";
import componentsPlugin from "./components";
import customJsRuntimePlugin from "./custom-js-runtime";

export const projectPlugins = [
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  componentsPlugin,
  customJsRuntimePlugin,
];

export {
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  componentsPlugin,
  customJsRuntimePlugin,
};
