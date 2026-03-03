/**
 * @file Vue 全局样式插件
 * @description 生成 src/assets/global.scss 文件
 */

import { createGlobalStylePlugin } from "../shared/global-style";

const vueGlobalStylePlugin = createGlobalStylePlugin({
  pluginName: "vue-global-style",
  rootSelector: "#app",
  filePath: "src/assets/global.scss",
});

export default vueGlobalStylePlugin;
