/**
 * @file Vue package.json 生成插件
 * @description 合并依赖并生成适用于 Vue 3 + Vite 5 项目的 package.json。
 */

import type { IProjectPlugin, ProjectBuilder } from "@lowcode/schema";

const vuePackageJsonPlugin: IProjectPlugin = {
  type: "project",
  name: "vue-package-json",

  run: (projectBuilder: ProjectBuilder) => {
    // 1. Vue 3 + Vite 5 核心依赖
    const coreDependencies: Record<string, string> = {
      vue: "^3.4.0",
      "vue-router": "^4.3.0",
      "ant-design-vue": "^4.2.0",
      "@ant-design/icons-vue": "^7.0.0",
    };

    // 2. 开发依赖
    const coreDevDependencies: Record<string, string> = {
      "@vitejs/plugin-vue": "^5.0.0",
      typescript: "^5.2.2",
      vite: "^5.2.0",
      "vue-tsc": "^2.0.0",
      sass: "^1.77.0",
      "@types/node": "^20.11.0",
    };

    // 3. scripts
    const scripts = {
      dev: "vite",
      build: "vue-tsc && vite build",
      preview: "vite preview",
    };

    // 4. 合并 IR + 插件注册的依赖
    const collectedDeps = projectBuilder.collectDependencies();
    const dependencies = {
      ...collectedDeps,
      ...coreDependencies,
    };

    // 5. 生成 package.json
    const packageJsonContent = {
      name: "lowcode-vue-project",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts,
      dependencies,
      devDependencies: coreDevDependencies,
    };

    projectBuilder.addFile({
      fileName: "package.json",
      filePath: "package.json",
      content: JSON.stringify(packageJsonContent, null, 2),
      fileType: "json",
    });
  },
};

export default vuePackageJsonPlugin;
