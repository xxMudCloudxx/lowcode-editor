/**
 * @file React 全局样式插件
 * @description 生成 src/global.scss 文件
 */

import { createGlobalStylePlugin } from "../shared/global-style";

const globalStylePlugin = createGlobalStylePlugin({
  pluginName: "react-global-style",
  rootSelector: "#root",
  filePath: "src/global.scss",
});

export default globalStylePlugin;
