/**
 * @file React 路由插件
 * @description 基于 irProject.pages 生成 React Router 配置
 */

import type { ProjectBuilder, IProjectPlugin } from "@lowcode/schema";
import { generateRouteData } from "../shared/router-utils";

const getRouterContent = (projectBuilder: ProjectBuilder): string => {
  const routes = generateRouteData(projectBuilder, "");

  const routeImports = routes
    .map((r) => `import ${r.componentName} from '${r.importPath}';`)
    .join("\n");

  const routeConfig = routes
    .map(
      (r) => `
      {
        path: '${r.path}',
        element: <${r.componentName} />,
      },`,
    )
    .join("");

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
