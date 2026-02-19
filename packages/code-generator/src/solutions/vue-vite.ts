/**
 * @file Vue + Vite 出码解决方案骨架
 * @description 验证性骨架，用于证明多目标架构的扩展点可用。
 *              不做实际代码生成，仅提供最基本的 Vue 项目结构。
 */

import type {
  ISolution,
  IProjectTemplate,
  IGeneratedFile,
} from "@lowcode/schema";
import { zipPublisher } from "../publisher/zip-publisher";

// --- Vue Vite 项目模板 (最小骨架) ---
const vueViteTemplate: IProjectTemplate = {
  name: "vue-vite",

  getStaticFiles(): IGeneratedFile[] {
    return [
      {
        fileName: "package.json",
        filePath: "package.json",
        content: JSON.stringify(
          {
            name: "lowcode-vue-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "vue-tsc && vite build",
              preview: "vite preview",
            },
            dependencies: {
              vue: "^3.4.0",
            },
            devDependencies: {
              "@vitejs/plugin-vue": "^5.0.0",
              typescript: "^5.2.2",
              vite: "^5.2.0",
              "vue-tsc": "^2.0.0",
            },
          },
          null,
          2,
        ),
        fileType: "json",
      },
      {
        fileName: "index.html",
        filePath: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
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
      {
        fileName: "main.ts",
        filePath: "src/main.ts",
        content: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
`,
        fileType: "ts",
      },
      {
        fileName: "App.vue",
        filePath: "src/App.vue",
        content: `<script setup lang="ts">
// TODO: 由出码插件生成页面内容
</script>

<template>
  <div id="app">
    <h1>Vue Lowcode Project</h1>
    <p>此项目由 lowcode-editor 自动生成。</p>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 60px;
}
</style>
`,
        fileType: "other",
      },
    ];
  },
};

/**
 * Vue + Vite 出码方案 (骨架)
 *
 * 目前只有 Template 层，不包含任何 Component Plugin 或 Project Plugin。
 * 调用此 Solution 将只生成一个最基本的 Vue 3 + Vite 空项目。
 */
const vueSolution: ISolution = {
  name: "vue-vite",
  description: "基于 Vue 3 + Vite 5 + TypeScript 的 SPA 项目 (骨架)",

  template: vueViteTemplate,

  // 暂无组件级插件（需要开发 Vue SFC 生成插件）
  componentPlugins: [],

  // 暂无项目级插件
  projectPlugins: [],

  // 暂无后处理器
  postProcessors: [],

  publisher: zipPublisher,
};

export default vueSolution;
