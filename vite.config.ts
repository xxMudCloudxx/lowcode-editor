import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";

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
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts", // 指向我们的测试配置文件
    // 如果需要，可以配置 UI
    ui: true,
  },
});
