// src/code-generator/plugins/project/index.ts

/**
 * @file 项目级插件兼容入口
 * @description 历史上该目录默认承载 React 插件；现已按框架拆分为 react/ 与 vue/。
 * 当前文件仅作为兼容桥接，避免旧引用路径失效。
 */

export {
  projectPlugins,
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  componentsPlugin,
} from "./react";
