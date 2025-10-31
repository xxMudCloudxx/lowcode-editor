// src/code-generator/types/plugin.ts

/**
 * @file 出码插件核心类型定义
 * @description 定义了不同类型的插件及其执行签名
 */

import type { IGeneratedFile, IRNode } from "./ir";
import type { ModuleBuilder } from "../generator/module-builder";
import type { ProjectBuilder } from "../generator/project-builder";

/**
 * @interface IComponentPlugin
 * @description 组件级别插件：处理单个 IRNode，生成代码块并放入 ModuleBuilder。
 * @example jsxPlugin, cssPlugin
 */
export interface IComponentPlugin {
  type: "component";
  name: string;
  /**
   * 执行组件插件
   * @param irNode - 当前处理的 IR 节点
   * @param moduleBuilder - 当前页面的模块构建器
   * @param projectBuilder - (可选) 整个项目的构建器，用于访问项目级信息
   */
  run: (
    irNode: IRNode,
    moduleBuilder: ModuleBuilder,
    projectBuilder?: ProjectBuilder
  ) => void;
}

/**
 * @interface IProjectPlugin
 * @description 项目级别插件：处理整个项目，向 ProjectBuilder 添加文件或修改配置。
 * @example routerPlugin, globalStylePlugin, entryPlugin
 */
export interface IProjectPlugin {
  type: "project";
  name: string;
  /**
   * 执行项目插件
   * @param projectBuilder - 整个项目的构建器
   */
  run: (projectBuilder: ProjectBuilder) => void;
}

/**
 * @interface IPostProcessor
 * @description 后处理器：在所有文件生成后，对单个文件进行最终处理。
 * @example prettier
 */
export type IPostProcessor = (
  file: IGeneratedFile
) => Promise<IGeneratedFile> | IGeneratedFile; // <-- 2. 定义类型

/**
 * @type CodeGeneratorPlugin
 * @description 所有出码插件的联合类型
 */
export type ICodeGeneratorPlugin = IComponentPlugin | IProjectPlugin; // | IPostprocessorPlugin | IPublisherPlugin
