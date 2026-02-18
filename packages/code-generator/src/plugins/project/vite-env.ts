// src/code-generator/plugins/project/vite-env.ts

import type { IProjectPlugin } from "../../types/plugin";
import type { ProjectBuilder } from "../../generator/project-builder";

/**
 * @file vite-env.d.ts 生成插件
 *
 * @description 职责：
 * 1. 生成一个标准的 vite-env.d.ts 文件，包含 vite/client 类型。
 * 2. [关键] 添加对 SCSS/CSS 模块的类型声明，以修复类型检查错误。
 * 3. 将文件添加到 projectBuilder 的 src/ 目录
 */
const viteEnvPlugin: IProjectPlugin = {
  type: "project",
  name: "vite-env",

  run: (projectBuilder: ProjectBuilder) => {
    const content = `
/// <reference types="vite/client" />

/**
 * 声明对 .scss 模块的类型支持
 * 这将允许 TypeScript 正确处理 import styles from './xxx.module.scss';
 */
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

/**
 * 声明对 .css 模块的类型支持
 */
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

/**
 * 声明对 .less 模块的类型支持 (如果未来需要)
 */
// declare module '*.module.less' {
//   const classes: { [key: string]: string };
//   export default classes;
// }
`;

    // 2. 添加文件到 ProjectBuilder
    projectBuilder.addFile({
      fileName: "vite-env.d.ts",
      filePath: "src/vite-env.d.ts", // 必须在 src 目录下
      content: content.trim(),
      fileType: "ts",
    });
  },
};

export default viteEnvPlugin;
