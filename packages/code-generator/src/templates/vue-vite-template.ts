/**
 * @file Vue + Vite 项目模板
 * @description 实现 IProjectTemplate 接口，提供不依赖 IR 的静态脚手架文件。
 */

import type { IProjectTemplate, IGeneratedFile } from "@lowcode/schema";
import { getTsconfigNodeJson, getGitignore } from "./shared";

export const vueViteTemplate: IProjectTemplate = {
  name: "vue-vite",

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
              module: "ESNext",
              lib: ["ES2020", "DOM", "DOM.Iterable"],
              skipLibCheck: true,
              moduleResolution: "bundler",
              allowImportingTsExtensions: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: "preserve",
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: false,
              noFallthroughCasesInSwitch: true,
              baseUrl: ".",
              paths: { "@/*": ["./src/*"] },
            },
            include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
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
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
`,
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
    <title>Lowcode Vue Project</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
        fileType: "html",
      },

      // --- env.d.ts ---
      {
        fileName: "env.d.ts",
        filePath: "src/env.d.ts",
        content: `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`,
        fileType: "ts",
      },

      // --- .gitignore (共享) ---
      getGitignore(),
    ];
  },
};
