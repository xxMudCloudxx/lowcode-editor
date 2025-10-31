// src/code-generator/generator/project-builder.ts

/**
 * @file 项目构建器
 * @description 管理整个项目的文件生成，并提供创建 ModuleBuilder 的能力。
 */

import { ModuleBuilder } from "./module-builder";
import type { IRProject, IRPage, IGeneratedFile } from "../types/ir";
import { camelCase, upperFirst } from "lodash-es"; // 确保导入
import type { IPostProcessor } from "../types/plugin";

/**
 * 项目构建器类，用于管理和生成项目的所有文件。
 */
export class ProjectBuilder {
  /** 存储生成的文件，Key 为文件路径 */
  private files: Map<string, IGeneratedFile> = new Map();
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

  // --- 阶段性方法 (示例，实际逻辑在插件中) ---

  /**
   * 【示例】为单个页面生成文件 (实际应由插件完成)。
   * 此方法仅作演示，实际的 JSX 生成和文件添加逻辑在 Solution 中调用插件完成。
   * @param page - 要生成文件的 IRPage 对象。
   * @deprecated 此方法仅为示例，实际逻辑应在插件中实现。
   */
  generatePageFiles_ExampleOnly(page: IRPage): void {
    const moduleBuilder = this.createModuleBuilder();
    // JSX 生成逻辑将在插件中完成，这里只是示意
    // moduleBuilder.setJSX('<div>Generated Page Content</div>');

    // --- 修正 ---
    // 收集页面依赖并添加到 moduleBuilder
    // ! 此处调用已失效，因为 addImport 签名已更改。
    // ! 实际的 addImport 调用在 jsx.ts 插件中通过遍历 IRNode 树来完成。
    // page.dependencies.forEach((dep) => moduleBuilder.addImport(dep)); // <--- 注释掉此行
    moduleBuilder.addReactImport("React"); // 默认导入 React

    const componentName = page.fileName; // 使用文件名作为组件名基础
    const fileName = `${componentName}.tsx`; // 假设页面都是 tsx
    // 统一文件输出路径结构，例如 src/pages/PageName/PageName.tsx
    const filePath = `src/pages/${upperFirst(
      camelCase(componentName)
    )}/${fileName}`;
    const content = moduleBuilder.generateModule(componentName);

    this.addFile({
      fileName,
      filePath,
      content,
      fileType: "tsx",
    });
  }
}
