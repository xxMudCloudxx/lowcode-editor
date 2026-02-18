// src/code-generator/plugins/project/global-style.ts

/**
 * @file 全局样式插件
 * @description 生成 src/global.scss 文件
 */

import type { IProjectPlugin } from "../../types/plugin";

// 基础的全局样式
const getGlobalStyleContent = () => `
/*
 * @file 全局样式
 * @description 由 lowcode-editor 自动生成
 */

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
`;

const globalStylePlugin: IProjectPlugin = {
  type: "project",
  name: "react-global-style",

  run: (projectBuilder) => {
    projectBuilder.addFile({
      fileName: "global.scss",
      filePath: "src/global.scss",
      content: getGlobalStyleContent(),
      fileType: "scss",
    });
  },
};

export default globalStylePlugin;
