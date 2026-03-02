/**
 * @file Vue 应用入口插件
 * @description 生成 src/main.ts 和 src/App.vue
 */

import type { IProjectPlugin } from "@lowcode/schema";

const getAppVueContent = (): string => `<!-- App.vue - 由 lowcode-editor 自动生成 -->
<script setup lang="ts">
import { RouterView } from 'vue-router';
import './assets/global.scss';
</script>

<template>
  <div class="lowcode-app">
    <RouterView />
  </div>
</template>

<style scoped>
.lowcode-app {
  min-height: 100vh;
}
</style>
`;

const getMainTsContent = (): string => `/**
 * @file 应用渲染入口
 * @description 由 lowcode-editor 自动生成
 */

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(router);

app.mount('#app');
`;

const vueEntryPlugin: IProjectPlugin = {
  type: "project",
  name: "vue-entry",

  run: (projectBuilder) => {
    // 1. App.vue
    projectBuilder.addFile({
      fileName: "App.vue",
      filePath: "src/App.vue",
      content: getAppVueContent(),
      fileType: "other",
    });

    // 2. main.ts
    projectBuilder.addFile({
      fileName: "main.ts",
      filePath: "src/main.ts",
      content: getMainTsContent(),
      fileType: "ts",
    });
  },
};

export default vueEntryPlugin;
