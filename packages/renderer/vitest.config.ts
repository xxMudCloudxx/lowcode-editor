import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@lowcode/schema": path.resolve(__dirname, "../schema/src"),
      "@lowcode/expression": path.resolve(__dirname, "../expression/src"),
    },
  },
});
