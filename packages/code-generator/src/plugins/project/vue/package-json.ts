/**
 * @file Vue package.json 生成插件
 * @description 合并依赖并生成适用于 Vue 3 + Vite 5 项目的 package.json。
 */

import { createPackageJsonPlugin } from "../shared/package-json";

const vuePackageJsonPlugin = createPackageJsonPlugin({
  pluginName: "vue-package-json",
  projectName: "lowcode-vue-project",
  coreDependencies: {
    vue: "^3.4.0",
    "vue-router": "^4.3.0",
    "ant-design-vue": "^4.2.0",
    "@ant-design/icons-vue": "^7.0.0",
  },
  coreDevDependencies: {
    "@vitejs/plugin-vue": "^5.0.0",
    typescript: "^5.2.2",
    vite: "^5.2.0",
    "vue-tsc": "^2.0.0",
    sass: "^1.77.0",
    "@types/node": "^20.11.0",
  },
  scripts: {
    dev: "vite",
    build: "vue-tsc && vite build",
    preview: "vite preview",
  },
});

export default vuePackageJsonPlugin;
