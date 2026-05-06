import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";

import path from "path";
const REPO_NAME = "lowcode-editor";

export default defineConfig({
  root: __dirname,
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    tailwindcss(),
    monacoEditorPlugin({
      languageWorkers: ["json", "css", "html", "typescript"],
    }) as any,
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@assets", replacement: path.resolve(__dirname, "../../assets") },
      {
        find: "@lowcode/materials/codegen",
        replacement: path.resolve(__dirname, "../materials/src/codegen.ts"),
      },
      {
        find: "@lowcode/schema",
        replacement: path.resolve(__dirname, "../schema/src"),
      },
      {
        find: "@lowcode/expression",
        replacement: path.resolve(__dirname, "../expression/src/index.ts"),
      },
      {
        find: "@lowcode/materials",
        replacement: path.resolve(__dirname, "../materials/src/index.tsx"),
      },
      {
        find: "@lowcode/renderer",
        replacement: path.resolve(__dirname, "../renderer/src/index.tsx"),
      },
      {
        find: "@lowcode/code-generator",
        replacement: path.resolve(__dirname, "../code-generator/src/index.ts"),
      },
    ],
  },
  server: {
    fs: {
      // 允许访问根目录下的 assets
      allow: ["..", "../../assets"],
    },
  },
  // MPA 多入口：主编辑器 + Renderer (iframe)
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        renderer: path.resolve(__dirname, "renderer.html"),
      },
    },
  },
  worker: {
    format: "es",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: path.resolve(__dirname, "src/test/setup.ts"),
    // 默认关闭 UI，避免 CLI/CI 环境缺少 @vitest/ui 时启动失败。
    ui: process.env.VITEST_UI === "true",
  },
});
