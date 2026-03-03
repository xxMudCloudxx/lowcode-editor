/**
 * @file React + Vite 项目模板
 * @description 实现 IProjectTemplate 接口，提供不依赖 IR 的静态脚手架文件。
 */

import type { IProjectTemplate, IGeneratedFile } from "@lowcode/schema";
import { getTsconfigNodeJson, getGitignore } from "./shared";

export const reactViteTemplate: IProjectTemplate = {
  name: "react-vite",

  getStaticFiles(): IGeneratedFile[] {
    return [
      // --- tsconfig.json ---
      {
        fileName: "tsconfig.json",
        filePath: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2020",
              useDefineForClassFields: true,
              lib: ["ES2020", "DOM", "DOM.Iterable"],
              module: "ESNext",
              skipLibCheck: true,
              moduleResolution: "bundler",
              allowImportingTsExtensions: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: "react-jsx",
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: false,
              noFallthroughCasesInSwitch: true,
              baseUrl: ".",
              paths: { "@/*": ["./src/*"] },
            },
            include: ["src"],
            references: [{ path: "./tsconfig.node.json" }],
          },
          null,
          2,
        ),
        fileType: "json",
      },

      // --- tsconfig.node.json (共享) ---
      getTsconfigNodeJson(),

      // --- vite.config.ts ---
      {
        fileName: "vite.config.ts",
        filePath: "vite.config.ts",
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})`,
        fileType: "ts",
      },

      // --- index.html ---
      {
        fileName: "index.html",
        filePath: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lowcode Generated Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
        fileType: "html",
      },

      // --- .gitignore (共享) ---
      getGitignore(),

      // --- src/vite-env.d.ts ---
      {
        fileName: "vite-env.d.ts",
        filePath: "src/vite-env.d.ts",
        content: `/// <reference types="vite/client" />

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
}`,
        fileType: "ts",
      },
    ];
  },
};
