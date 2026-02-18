// src/code-generator/plugins/project/package-json.ts

import type { IProjectPlugin } from "../../types/plugin";
import type { ProjectBuilder } from "../../generator/project-builder";

/**
 * @file package.json 生成插件
 *
 * @description 职责：
 * 1. 合并 irProject.dependencies (来自 schema 解析)
 * 2. 添加 React + Vite 模板所需的固定依赖
 * 3. 添加其他插件引入的依赖 (如 react-router-dom)
 * 4. 添加开发依赖和 scripts
 * 5. 将 package.json 文件添加到 projectBuilder
 */
const packageJsonPlugin: IProjectPlugin = {
  type: "project",
  name: "package-json",

  run: (projectBuilder: ProjectBuilder) => {
    const irProject = projectBuilder.ir;

    // 1. 定义 React + Vite 模板的核心依赖
    // 注意：这里的版本号应与您的目标项目匹配，这里使用当前流行的版本
    const coreDependencies: Record<string, string> = {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      // 您的 router.ts 插件会生成路由，因此需要此依赖
      "react-router-dom": "^6.23.0",
      "@vitejs/plugin-react": "^4.2.1",
      typescript: "^5.2.2",
      vite: "^5.2.0",
      // react-vite.ts 方案中的 cssPlugin 生成了 .scss 文件
      sass: "^1.77.0",
    };

    // 2. 定义开发依赖
    const coreDevDependencies: Record<string, string> = {
      "@types/react": "^18.2.66",
      "@types/react-dom": "^18.2.22",
      "@typescript-eslint/eslint-plugin": "^7.2.0",
      "@typescript-eslint/parser": "^7.2.0",
      eslint: "^8.57.0",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.4.6",
    };

    // 3. 定义 scripts
    const scripts = {
      dev: "vite",
      build: "tsc && vite build",
      lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      preview: "vite preview",
    };

    // 4. 合并所有依赖
    // irProject.dependencies 是从 schema 解析来的 (e.g., { 'antd': '^5.0.0' })
    const dependencies = {
      ...irProject.dependencies,
      ...coreDependencies,
    };

    // 5. 创建 package.json 内容
    const packageJsonContent = {
      name: "lowcode-generated-project", // TODO: 将来可以从 irProject.name 或插件配置中读取
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: scripts,
      dependencies: dependencies,
      devDependencies: coreDevDependencies,
    };

    // 6. 添加文件到 ProjectBuilder
    projectBuilder.addFile({
      fileName: "package.json",
      filePath: "package.json", // 确保在项目根目录
      content: JSON.stringify(packageJsonContent, null, 2), // 格式化 JSON 字符串
      fileType: "json",
    });
  },
};

export default packageJsonPlugin;
