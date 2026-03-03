/**
 * @file Vue 路由插件
 * @description 基于 irProject.pages 生成 Vue Router 配置
 */

import type { ProjectBuilder, IProjectPlugin } from "@lowcode/schema";
import { generateRouteData } from "../shared/router-utils";

const getRouterContent = (projectBuilder: ProjectBuilder): string => {
  const routes = generateRouteData(projectBuilder, ".vue");

  const routeImports = routes
    .map((r) => `import ${r.componentName} from '${r.importPath}';`)
    .join("\n");

  const routeConfig = routes
    .map(
      (r) => `    {
      path: '${r.path}',
      name: '${r.componentName}',
      component: ${r.componentName},
    },`,
    )
    .join("\n");

  return `/**
 * @file 路由配置
 * @description 由 lowcode-editor 自动生成
 */

import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// --- 导入页面组件 ---
${routeImports}

// --- 路由配置 ---
const routes: RouteRecordRaw[] = [
${routeConfig}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
`;
};

const vueRouterPlugin: IProjectPlugin = {
  type: "project",
  name: "vue-router",

  run: (projectBuilder) => {
    projectBuilder.addDependency("vue-router", "^4.3.0");

    const content = getRouterContent(projectBuilder);

    projectBuilder.addFile({
      fileName: "index.ts",
      filePath: "src/router/index.ts",
      content,
      fileType: "ts",
    });
  },
};

export default vueRouterPlugin;
