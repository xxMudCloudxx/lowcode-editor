// src/code-generator/plugins/project/router.ts

/**
 * @file 路由插件
 * @description 基于 irProject.pages 生成路由配置
 */

import type { ProjectBuilder } from "../../generator/project-builder";
import type { IProjectPlugin } from "../../types/plugin";
import { upperFirst, camelCase } from "lodash-es";

/**
 * 生成路由配置文件内容
 */
const getRouterContent = (projectBuilder: ProjectBuilder): string => {
  const { pages } = projectBuilder.getIrProject();

  // 1. 生成路由导入 (Imports)
  const routeImports = pages
    .map((page) => {
      const componentName = upperFirst(camelCase(page.fileName));
      // 路径基于 react-vite.ts 中定义的 filePath 结构
      const importPath = `../pages/${componentName}/${componentName}`;
      return `import ${componentName} from '${importPath}';`;
    })
    .join("\n");

  // 2. 生成路由配置 (Routes Configuration)
  const routeConfig = pages
    .map((page) => {
      const componentName = upperFirst(camelCase(page.fileName));
      // 假设 fileName 为 'index' 的是主页
      const path = page.fileName === "index" ? "/" : `/${page.fileName}`;
      return `
      {
        path: '${path}',
        element: <${componentName} />,
      },`;
    })
    .join("");

  // 3. 生成模板
  return `
/**
 * @file 路由配置
 * @description 由 lowcode-editor 自动生成
 */

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// --- 导入页面组件 ---
${routeImports}

// --- 路由配置 ---
const routes = [
  ${routeConfig}
];

const router = createBrowserRouter(routes);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
`;
};

const routerPlugin: IProjectPlugin = {
  type: "project",
  name: "react-router",

  run: (projectBuilder) => {
    // 注意：这个插件依赖 react-router-dom
    // 阶段三(工程化)中，我们会自动将其添加到 package.json
    // projectBuilder.addDependency('react-router-dom', '^6.0.0');

    const content = getRouterContent(projectBuilder);

    projectBuilder.addFile({
      fileName: "index.tsx",
      filePath: "src/router/index.tsx",
      content: content,
      fileType: "tsx",
    });
  },
};

export default routerPlugin;
