// src/code-generator/plugins/project/index.ts

import globalStylePlugin from "./global-style";
import routerPlugin from "./router";
import entryPlugin from "./entry";
import packageJsonPlugin from "./package-json";
import viteConfigPlugin from "./vite-config";
import tsConfigPlugin from "./tsconfig";
// 以后还会有 utilsPlugin, packageJsonPlugin 等

export const projectPlugins = [
  globalStylePlugin,
  routerPlugin,
  entryPlugin,
  packageJsonPlugin,
  viteConfigPlugin,
  tsConfigPlugin,
  // ...
];

export { globalStylePlugin, routerPlugin, entryPlugin };
