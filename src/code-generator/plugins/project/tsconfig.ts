// src/code-generator/plugins/project/tsconfig.ts

import type { IProjectPlugin } from "../../types/plugin";
import type { ProjectBuilder } from "../../generator/project-builder";

/**
 * @file TypeScript 配置文件生成插件
 *
 * @description 职责：
 * 1. 生成 tsconfig.json (用于项目源码)
 * 2. 生成 tsconfig.node.json (用于 Vite/ESLint 等构建工具的配置)
 * 3. 将文件添加到 projectBuilder 的根目录
 */
const tsConfigPlugin: IProjectPlugin = {
  type: "project",
  name: "tsconfig",

  run: (projectBuilder: ProjectBuilder) => {
    // 1. 定义 tsconfig.json 的内容
    // 这是 Vite + React + TS 的标准配置
    const tsConfigJson = {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,

        /* Bundler mode */
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",

        /* Linting */
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,

        /* Alias */
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
        },
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }],
    };

    // 2. 定义 tsconfig.node.json 的内容
    const tsConfigNodeJson = {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true,
      },
      include: ["vite.config.ts"],
    };

    // 3. 添加 tsconfig.json
    projectBuilder.addFile({
      fileName: "tsconfig.json",
      filePath: "tsconfig.json",
      content: JSON.stringify(tsConfigJson, null, 2),
      fileType: "json",
    });

    // 4. 添加 tsconfig.node.json
    projectBuilder.addFile({
      fileName: "tsconfig.node.json",
      filePath: "tsconfig.node.json",
      content: JSON.stringify(tsConfigNodeJson, null, 2),
      fileType: "json",
    });
  },
};

export default tsConfigPlugin;
