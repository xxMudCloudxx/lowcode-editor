/**
 * @file package.json 插件工厂（框架无关）
 * @description 合并 IR 依赖 + 核心依赖 + 开发依赖，生成 package.json。
 *              各框架只需传入不同的依赖列表和 scripts。
 */

import type { IProjectPlugin, ProjectBuilder } from "@lowcode/schema";

export interface PackageJsonConfig {
  pluginName: string;
  projectName: string;
  coreDependencies: Record<string, string>;
  coreDevDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export function createPackageJsonPlugin(
  config: PackageJsonConfig,
): IProjectPlugin {
  return {
    type: "project",
    name: config.pluginName,

    run: (projectBuilder: ProjectBuilder) => {
      // 合并 IR 解析 + 插件注册的依赖
      const collectedDeps = projectBuilder.collectDependencies();
      const dependencies = {
        ...collectedDeps,
        ...config.coreDependencies,
      };

      const packageJsonContent = {
        name: config.projectName,
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: config.scripts,
        dependencies,
        devDependencies: config.coreDevDependencies,
      };

      projectBuilder.addFile({
        fileName: "package.json",
        filePath: "package.json",
        content: JSON.stringify(packageJsonContent, null, 2),
        fileType: "json",
      });
    },
  };
}
