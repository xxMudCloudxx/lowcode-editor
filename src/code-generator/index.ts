// src/code-generator/index.ts

/**
 * @file 代码生成器入口文件
 * @description 提供了导出源代码的主函数，是连接编辑器和出码流水线的桥梁。
 */

// 导入类型定义，假设它们在 types/ir.ts 中
// ISchema 是我的编辑器 Schema 结构
import type { ISchema } from "./types/ir";

// 导入 ProjectBuilder 和生成的文件类型
import type {
  ProjectBuilder,
  IGeneratedFile,
} from "./generator/project-builder";

// 导入我们定义的 React + Vite 解决方案
import reactViteSolution from "./solutions/react-vite";

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
   * @description 未来可扩展支持 'vue-vite' 等
   */
  solution?: "react-vite";
  /** 输出到本地磁盘的路径 (用于 disk publisher, 阶段三) */
  outputPath?: string;
  /** 输出的 ZIP 压缩包文件名 (用于 zip publisher, 阶段三) */
  zipFileName?: string;
  /** 是否进行代码格式化 (阶段四) */
  // format?: boolean;
  // 其他可能的选项...
}

/**
 * 导出结果接口
 */
export interface IExportResult {
  /** 是否成功 */
  success: boolean;
  /**
   * 生成的文件内容数组
   * @description 仅在不执行发布操作时返回（例如阶段一的测试）
   */
  files?: IGeneratedFile[];
  /** 错误信息 (如果失败) */
  message?: string;
  /** 最终输出的文件路径或压缩包名 (如果进行了发布操作) */
  outputPath?: string;
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
  options: IExportOptions = {}
): Promise<IExportResult> {
  try {
    // --- 1. 选择并运行解决方案 ---
    const solutionName = options.solution || "react-vite"; // 默认使用 react-vite 方案
    let projectBuilder: ProjectBuilder;

    console.log(`[CodeGenerator] 开始执行出码，使用解决方案: ${solutionName}`);

    if (solutionName === "react-vite") {
      // 调用 ReactVite 方案的 run 方法，启动流水线
      projectBuilder = reactViteSolution.run(schema);
    } else {
      // 如果未来支持更多方案，在这里添加分支
      throw new Error(`不支持的解决方案: ${solutionName}`);
    }

    console.log("[CodeGenerator] 代码结构生成完毕。");

    // --- 2. 获取生成的文件 ---
    let files = projectBuilder.generateFiles();

    // --- 3. (未来阶段) 执行后处理器 (例如 Prettier 格式化) ---
    // if (options.format) {
    //     console.log('[CodeGenerator] 开始执行代码格式化...');
    //     files = await runPostprocessors(files, projectBuilder);
    //     console.log('[CodeGenerator] 代码格式化完成。');
    // }

    // --- 4. (未来阶段) 执行发布器 ---
    // if (options.outputPath) {
    //     console.log(`[CodeGenerator] 开始将代码写入磁盘: ${options.outputPath}`);
    //     await diskPublisher.publish({ projectBuilder, files, options }); // 假设 publisher 接受 files
    //     console.log('[CodeGenerator] 代码写入磁盘完成。');
    //     return { success: true, outputPath: options.outputPath };
    // } else if (options.zipFileName) {
    //     console.log(`[CodeGenerator] 开始生成 ZIP 文件: ${options.zipFileName}`);
    //     const zipBlob = await zipPublisher.publish({ projectBuilder, files, options });
    //     console.log('[CodeGenerator] ZIP 文件生成完成。');
    //     // 在浏览器环境中，通常需要触发 Blob 下载
    //     // downloadBlob(zipBlob, options.zipFileName); // 需要实现 downloadBlob 函数
    //     return { success: true, outputPath: options.zipFileName };
    // } else {

    // 阶段一：仅返回内存中的文件结果用于验证
    console.log("[CodeGenerator] 出码完成，返回内存中的文件列表。");
    return { success: true, files: files };
    // }
  } catch (error: any) {
    console.error("[CodeGenerator] 代码生成失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

// --- 后处理器和发布器的运行函数占位符 (将在后续阶段实现) ---

/**
 * 【占位符】执行代码后处理插件。
 * @param files - 待处理的文件数组。
 * @param projectBuilder - ProjectBuilder 实例。
 * @returns 处理后的文件数组。
 */
// async function runPostprocessors(files: IGeneratedFile[], projectBuilder: ProjectBuilder): Promise<IGeneratedFile[]> {
//     console.log("执行后处理器 (例如 Prettier)...");
//     // 示例：应用 Prettier
//     // const formattedFiles = await Promise.all(files.map(async (file) => {
//     //     if (['tsx', 'ts', 'js', 'json', 'css', 'scss', 'less', 'html', 'md'].includes(file.fileType)) {
//     //         try {
//     //             const formattedContent = await prettierPostprocessor.run(file.content, file.fileType);
//     //             return { ...file, content: formattedContent };
//     //         } catch (formatError) {
//     //             console.warn(`格式化文件 ${file.filePath} 失败:`, formatError);
//     //             return file; // 格式化失败则返回原文件
//     //         }
//     //     }
//     //     return file;
//     // }));
//     // return formattedFiles;
//     return files; // 暂时返回原文件
// }
