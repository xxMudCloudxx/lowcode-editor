// src/code-generator/parser/component-metadata.ts

/**
 * @file 组件元数据相关的辅助函数
 * @description 提供根据组件名查找元数据、聚合项目依赖等功能。
 */

// 从常量文件中导入接口和映射表
import {
  componentMetadataMap,
  type IComponentMetadata,
} from "../const/component-metadata";
import type { IRDependency } from "@lowcode/schema";

/**
 * 根据组件在 Schema 中的名称获取其元数据。
 * @param componentName - Schema 中的组件名称 (name 字段)。
 * @returns 组件元数据对象，如果未找到则返回 undefined。
 */
export function getComponentMetadata(
  componentName: string,
): IComponentMetadata | undefined {
  // 直接使用导入的 componentMetadataMap
  return componentMetadataMap[componentName];
}

/**
 * 从元数据映射表中获取所有唯一的依赖声明。
 * @description 用于确定单个文件或整个项目需要 import 哪些包。
 * @param metadataMap - (通常是全局的) 组件元数据映射表。
 * @returns 包含所有唯一依赖项的数组。
 */
export function getAllDependencies(
  metadataMap: Record<string, IComponentMetadata>,
): IRDependency[] {
  const dependencies = new Map<string, IRDependency>();
  Object.values(metadataMap).forEach((meta) => {
    // 使用包名和组件名（或 exportName）作为 key 保证唯一性
    // 例如 'antd-Row', 'antd-Col', 'antd-List', './components/Page-Page'
    const key = `${meta.dependency.package}-${
      meta.dependency.exportName || meta.componentName
    }`;
    if (!dependencies.has(key)) {
      dependencies.set(key, meta.dependency);
    }
  });
  return Array.from(dependencies.values());
}

/**
 * 获取项目级别的依赖项 (NPM 包)，用于生成 package.json。
 * @description 从所有依赖项中筛选出需要安装的 NPM 包及其版本。
 * @param allDependencies - 从 getAllDependencies 获取的所有依赖项数组。
 * @returns 一个记录 NPM 包名和版本号的对象, e.g., { antd: '^5.0.0', react: '^18.0.0' }。
 */
export function getProjectDependencies(
  allDependencies: IRDependency[],
): Record<string, string> {
  const projectDeps: Record<string, string> = {};
  allDependencies.forEach((dep) => {
    // 只添加来自 npm 包的依赖 (package 字段存在且不以 '.' 开头)
    // 并且需要指定版本号 (version 字段存在)
    if (dep.package && !dep.package.startsWith(".") && dep.version) {
      projectDeps[dep.package] = dep.version;
    }
  });
  // 添加 React 和 ReactDOM 作为基础依赖 (版本号可根据项目配置调整)
  projectDeps["react"] = "^18.0.0"; // 或者从我的项目 package.json 读取
  projectDeps["react-dom"] = "^18.0.0";

  // 如果使用了 antd，可能还需要 @ant-design/icons
  if (projectDeps["antd"]) {
    projectDeps["@ant-design/icons"] = "^5.0.0"; // 假设版本匹配
  }

  return projectDeps;
}
