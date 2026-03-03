/**
 * @file 全局样式插件工厂（框架无关）
 * @description 生成全局 SCSS 文件，通过参数化 rootSelector 和 filePath 适配不同框架。
 *
 * 使用方式：
 *   React: createGlobalStylePlugin({ pluginName: "react-global-style", rootSelector: "#root", filePath: "src/global.scss" })
 *   Vue:   createGlobalStylePlugin({ pluginName: "vue-global-style",   rootSelector: "#app",  filePath: "src/assets/global.scss" })
 */

import type { IProjectPlugin } from "@lowcode/schema";

export interface GlobalStyleOptions {
  pluginName: string;
  rootSelector: string;
  filePath: string;
}

function getGlobalStyleContent(rootSelector: string) {
  return `/*
 * @file 全局样式
 * @description 由 lowcode-editor 自动生成
 */

html, body, ${rootSelector} {
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
}

export function createGlobalStylePlugin(
  options: GlobalStyleOptions,
): IProjectPlugin {
  return {
    type: "project",
    name: options.pluginName,

    run: (projectBuilder) => {
      const fileName = options.filePath.split("/").pop() || "global.scss";
      projectBuilder.addFile({
        fileName,
        filePath: options.filePath,
        content: getGlobalStyleContent(options.rootSelector),
        fileType: "scss",
      });
    },
  };
}
