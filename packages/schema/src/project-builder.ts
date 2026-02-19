// src/code-generator/generator/project-builder.ts

/**
 * @file 项目构建器
 * @description 管理整个项目的文件生成，并提供创建 ModuleBuilder 的能力。
 */

import { ModuleBuilder } from "./module-builder";
import type { IRProject, IRPage, IGeneratedFile } from "./ir";
import { camelCase, upperFirst } from "lodash-es"; // 确保导入
import type { IPostProcessor } from "./plugin";

/**
 * 项目构建器类，用于管理和生成项目的所有文件。
 */
export class ProjectBuilder {
  /** 存储生成的文件，Key 为文件路径 */
  private files: Map<string, IGeneratedFile> = new Map();
  /** 插件注册的依赖（按需收集） */
  private pluginDependencies: Map<string, string> = new Map();
  /** 项目的中间表示 (IR) */
  readonly ir: IRProject;

  /**
   * 创建 ProjectBuilder 实例。
   * @param ir - 项目的 IR 对象。
   */
  constructor(ir: IRProject) {
    this.ir = ir;
  }

  /**
   * 读取项目IR
   */
  getIrProject() {
    return this.ir;
  }
  /**
   * 添加一个文件到项目中。
   * 如果文件路径已存在，会覆盖旧文件并打印警告。
   * @param file - 要添加的文件对象 (IGeneratedFile)。
   */
  addFile(file: IGeneratedFile): void {
    if (this.files.has(file.filePath)) {
      console.warn(`文件已存在，将被覆盖: ${file.filePath}`);
    }
    this.files.set(file.filePath, file);
  }

  /**
   * 根据文件路径获取已添加的文件。
   * @param filePath - 文件在项目中的相对路径。
   * @returns 文件对象 (IGeneratedFile)，如果未找到则返回 undefined。
   */
  getFile(filePath: string): IGeneratedFile | undefined {
    return this.files.get(filePath);
  }

  /**
   * 获取项目中所有已生成的文件。
   * @returns 包含所有文件对象的数组。
   */
  generateFiles(): IGeneratedFile[] {
    return Array.from(this.files.values());
  }

  /**
   * 应用后处理器到所有已生成的文件。
   * @param processors - 要应用的后处理器数组。
   */
  async applyPostProcessors(processors: IPostProcessor[]): Promise<void> {
    if (!processors || processors.length === 0) {
      return;
    }

    console.log("Applying post-processors...");

    // 必须使用循环来支持 await
    const filePaths = Array.from(this.files.keys());

    for (const filePath of filePaths) {
      let processedFile = this.files.get(filePath)!;

      // 将所有处理器依次应用到文件上
      for (const processor of processors) {
        // 等待异步处理器完成
        processedFile = await processor(processedFile);
      }

      // 将处理后的文件放回 Map
      this.files.set(filePath, processedFile);
    }

    console.log("Post-processing complete.");
  }

  // --- 辅助方法 ---

  /**
   * 创建一个新的 ModuleBuilder 实例。
   * @returns ModuleBuilder 实例。
   */
  createModuleBuilder(): ModuleBuilder {
    return new ModuleBuilder();
  }

  /**
   * 注册一个运行时依赖（用于 package.json 生成）。
   * @param packageName - npm 包名
   * @param version - 版本范围
   */
  addDependency(packageName: string, version: string): void {
    this.pluginDependencies.set(packageName, version);
  }

  /**
   * 收集所有插件注册的依赖，合并 IR 中的依赖。
   * @returns 去重后的依赖映射 { packageName: version }
   */
  collectDependencies(): Record<string, string> {
    const deps: Record<string, string> = {};
    // 先合并 IR 中解析出来的依赖
    if (this.ir.dependencies) {
      Object.assign(deps, this.ir.dependencies);
    }
    // 再合并插件注册的依赖（插件优先级更高，可覆盖 IR 中的版本）
    this.pluginDependencies.forEach((version, pkg) => {
      deps[pkg] = version;
    });
    return deps;
  }
}
