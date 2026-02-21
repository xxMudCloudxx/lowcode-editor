// src/code-generator/plugins/project/vite-config.ts

import type { IProjectPlugin } from "@lowcode/schema";
import type { ProjectBuilder } from "@lowcode/schema";

/**
 * @file Vite 配置文件生成插件
 *
 * @description 职责：
 * 1. 生成一个基础的 vite.config.ts，包含 @vitejs/plugin-react
 * 2. 将文件添加到 projectBuilder 的根目录
 */
const viteConfigPlugin: IProjectPlugin = {
  type: "project",
  name: "vite-config",

  run: (projectBuilder: ProjectBuilder) => {
    // 1. 定义 vite.config.ts 的内容
    // 这是一个标准的 React + Vite + TS 模板
    const viteConfigContent = `
import { defineConfig } from 'vite'
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
    port: 3000, // 您可以根据需要修改端口
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
`;

    // 2. 添加文件到 ProjectBuilder
    projectBuilder.addFile({
      fileName: "vite.config.ts",
      filePath: "vite.config.ts", // 确保在项目根目录
      content: viteConfigContent.trim(),
      fileType: "ts",
    });
  },
};

export default viteConfigPlugin;
