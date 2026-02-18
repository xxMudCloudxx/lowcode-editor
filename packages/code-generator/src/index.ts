// src/code-generator/index.ts

/**
 * @file 代码生成器入口文件
 * @description 提供了导出源代码的主函数，是连接编辑器和出码流水线的桥梁。
 */

// 导入类型定义，假设它们在 types/ir.ts 中
// ISchema 是我的编辑器 Schema 结构
// 导入类型定义，假设它们在 types/ir.ts 中
// ISchema 是我的编辑器 Schema 结构
import type {
  IGeneratedFile,
  ISchema,
  ProjectBuilder,
  IPostProcessor,
} from "@lowcode/schema";

// 导入我们定义的 React + Vite 解决方案
import reactViteSolution from "./solutions/react-vite";
import { prettierPostProcessor } from "./postprocessor/prettier";
import { zipPublisher } from "./publisher/zip-publisher";
import { downloadBlob } from "./utils/download";
export { zipPublisher, downloadBlob };

// (未来阶段) 引入 Publisher，例如写入磁盘或生成 zip
// import diskPublisher from './publisher/disk';
// import zipPublisher from './publisher/zip';

// (未来阶段) 引入 Postprocessor, 例如代码格式化
// import prettierPostprocessor from './postprocessor/prettier';
/**
 * 导出源代码的选项接口
 */
export interface IExportOptions {
  /**
   * 指定使用的解决方案，默认为 'react-vite'
   */
  solution?: "react-vite";
  /**
   * 指定发布器
   * 'zip': 生成 zip 压缩包 (返回 Blob)
   * 'none': 不发布，仅返回内存中的文件 (用于测试)
   */
  publisher?: "zip" | "none"; // 未来可扩展 'disk'
  /**
   * 项目名称 (用于 zip 压缩包内的根目录)
   */
  projectName?: string;
}

/**
 * 导出结果接口
 */
export interface IExportResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 (如果失败) */
  message?: string;
  /** * 发布器产物 (例如 zip 的 Blob)
   * 仅当 options.publisher !== 'none' 时返回
   */
  blob?: Blob;
  /** * 建议的文件名 (例如 'my-project.zip')
   * 仅当 options.publisher !== 'none' 时返回
   */
  fileName?: string;
  /** * 原始文件列表
   * 仅当 options.publisher === 'none' 时返回
   */
  files?: IGeneratedFile[];
}

/**
 * 导出源代码的主函数。
 * @description 接收 Schema，调用解决方案执行完整的出码流水线。
 * @param schema - 输入的低代码 Schema (ISchemaNode 数组)。
 * @param options - 导出选项 (IExportOptions)。
 * @returns 返回一个包含导出结果的对象 (Promise<IExportResult>)。
 */
export async function exportSourceCode(
  schema: ISchema,
  options: IExportOptions = {},
): Promise<IExportResult> {
  const {
    solution = "react-vite",
    publisher = "zip",
    projectName = "lowcode-project",
  } = options;

  try {
    // --- 1. 选择并运行解决方案 ---
    let projectBuilder: ProjectBuilder;
    console.log(`[CodeGenerator] 开始执行出码，使用解决方案: ${solution}`);

    if (solution === "react-vite") {
      // 异步等待解决方案运行完毕 (它内部可能包含异步操作)
      projectBuilder = await reactViteSolution.run(schema);
    } else {
      throw new Error(`不支持的解决方案: ${solution}`);
    }
    console.log("[CodeGenerator] 代码结构生成完毕。");

    // --- 2. 执行后处理器 (例如 Prettier 格式化) ---
    console.log("[CodeGenerator] 开始执行代码格式化...");
    const postProcessors: IPostProcessor[] = [prettierPostProcessor()];
    // 异步等待所有后处理器执行完毕
    await projectBuilder.applyPostProcessors(postProcessors);
    console.log("[CodeGenerator] 代码格式化完成。");

    // 从 builder 中获取最终的文件
    const files = projectBuilder.generateFiles();

    // --- 3. 执行发布器 ---
    if (publisher === "zip") {
      console.log(`[CodeGenerator] 开始生成 ZIP 文件: ${projectName}.zip`);

      const blob = await zipPublisher(files, { projectName });

      console.log("[CodeGenerator] ZIP 文件生成完成。");
      return {
        success: true,
        blob: blob,
        fileName: `${projectName}.zip`,
      };
    } else if (publisher === "none") {
      // 仅返回内存中的文件结果用于验证
      console.log("[CodeGenerator] 出码完成，返回内存中的文件列表。");
      return { success: true, files: files };
    } else {
      throw new Error(`不支持的发布器: ${publisher}`);
    }
  } catch (error: any) {
    console.error("[CodeGenerator] 代码生成失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

/**
 * [辅助函数] 导出并立即触发下载
 * 这是为 UI 提供的便捷方法
 */
export async function exportCodeAndDownload(
  schema: ISchema,
  projectName: string = "my-lowcode-project",
) {
  try {
    const result = await exportSourceCode(schema, {
      publisher: "zip",
      projectName: projectName,
    });

    if (result.success && result.blob && result.fileName) {
      // 触发下载
      downloadBlob(result.blob, result.fileName);
    } else {
      throw new Error(result.message || "生成 ZIP 文件失败");
    }
  } catch (error: any) {
    console.error("[CodeGenerator] 导出并下载失败:", error);
    // 在这里您可以统一处理 UI 提示，例如 alert 或 message
    alert(`导出失败: ${error.message}`);
  }
}
