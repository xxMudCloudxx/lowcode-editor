/**
 * @file 路由数据生成工具（框架无关）
 * @description 从 ProjectBuilder 中提取页面信息，生成结构化的路由数据。
 *              各框架（React / Vue / UniApp）复用此逻辑，仅在代码模板层面做差异化。
 */

import type { ProjectBuilder } from "@lowcode/schema";
import { upperFirst, camelCase } from "lodash-es";

export interface RouteInfo {
  /** PascalCase 组件名，例如 "Index", "UserProfile" */
  componentName: string;
  /** 路由路径，例如 "/", "/user-profile" */
  path: string;
  /** 原始文件名 */
  fileName: string;
  /** 导入路径（已拼接扩展名），例如 "../pages/Index/Index.vue" */
  importPath: string;
}

/**
 * 从 ProjectBuilder 中提取路由数据
 * @param projectBuilder - 项目构建器实例
 * @param fileExtension - 页面文件扩展名，例如 ".vue"（React 传空字符串 ""）
 */
export function generateRouteData(
  projectBuilder: ProjectBuilder,
  fileExtension: string,
): RouteInfo[] {
  const { pages } = projectBuilder.getIrProject();

  return pages.map((page) => {
    const componentName = upperFirst(camelCase(page.fileName));
    const path = page.fileName === "index" ? "/" : `/${page.fileName}`;
    const importPath = `../pages/${componentName}/${componentName}${fileExtension}`;

    return { componentName, path, fileName: page.fileName, importPath };
  });
}
