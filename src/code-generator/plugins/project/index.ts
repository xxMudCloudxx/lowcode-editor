// src/code-generator/plugins/project/index.ts

import globalStylePlugin from "./global-style";
import routerPlugin from "./router";
import entryPlugin from "./entry";
// 以后还会有 utilsPlugin, packageJsonPlugin 等

export const projectPlugins = [
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  // ...
];

export { globalStylePlugin, routerPlugin, entryPlugin };
