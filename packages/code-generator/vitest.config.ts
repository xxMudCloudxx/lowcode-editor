import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/plugins/**", // Phase 2: 快照测试
        "src/templates/**", // Phase 2: 快照测试
        "src/solutions/**", // Phase 2: 集成测试
        "src/publisher/**", // 依赖 jszip/file-saver
        "src/postprocessor/**", // 依赖 prettier standalone
      ],
    },
  },
  resolve: {
    alias: {
      "@lowcode/schema": path.resolve(__dirname, "../schema/src"),
      "@lowcode/materials/codegen": path.resolve(
        __dirname,
        "../materials/src/codegen",
      ),
    },
  },
});
