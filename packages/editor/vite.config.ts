import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";

import path from "path";
const REPO_NAME = "lowcode-editor";

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    tailwindcss(),
    monacoEditorPlugin({
      languageWorkers: ["json", "css", "html", "typescript"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "../../assets"),
    },
  },
  server: {
    fs: {
      // 允许访问根目录下的 assets
      allow: ["..", "../../assets"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts", // 指向我们的测试配置文件
    // 如果需要，可以配置 UI
    ui: true,
  },
});
