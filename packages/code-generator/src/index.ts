/**
 * @file 代码生成器入口文件
 * @description 提供了导出源代码的主函数，是连接编辑器和出码流水线的桥梁。
 *              基于 ISolution 接口实现通用的 Pipeline 调度。
 */

import type {
  IGeneratedFile,
  ISchema,
  ISolution,
  IProjectPlugin,
  IRPage,
  IPublishResult,
} from "@lowcode/schema";
import { ProjectBuilder } from "@lowcode/schema";

// 内置 Solutions
import reactViteSolution from "./solutions/react-vite";
import vueSolution from "./solutions/vue-vite";

// 工具函数
import { SchemaParser } from "./parser/schema-parser";
import { runPreprocessors } from "./preprocessor";
import { downloadBlob } from "./utils/download";
import { camelCase, upperFirst } from "lodash-es";

export { downloadBlob };

// --- Solution 注册表 ---
const solutionRegistry: Record<string, ISolution> = {
  "react-vite": reactViteSolution,
  "vue-vite": vueSolution,
};

/**
 * 注册一个自定义 Solution
 * @param solution - 要注册的 Solution 实例
 */
export function registerSolution(solution: ISolution): void {
  solutionRegistry[solution.name] = solution;
}

/**
 * 获取所有已注册的 Solution 名称
 */
export function getRegisteredSolutions(): string[] {
  return Object.keys(solutionRegistry);
}

/**
 * 导出源代码的选项接口
 */
export interface IExportOptions {
  /**
   * 指定使用的解决方案
   * - 字符串：引用内置或已注册的 Solution（如 'react-vite'）
   * - ISolution 对象：直接传入自定义 Solution
   * @default 'react-vite'
   */
  solution?: string | ISolution;
  /**
   * 是否跳过发布器（仅返回内存中的文件列表，用于测试）
   * @default false
   */
  skipPublisher?: boolean;
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
  /** 发布器的完整结果 */
  publishResult?: IPublishResult;
  /** 原始文件列表 (当 skipPublisher 为 true 时返回) */
  files?: IGeneratedFile[];
}

// --- 通用 Pipeline ---

/**
 * 解析 Solution 参数
 */
function resolveSolution(input: string | ISolution = "react-vite"): ISolution {
  if (typeof input === "string") {
    const solution = solutionRegistry[input];
    if (!solution) {
      throw new Error(
        `不支持的解决方案: ${input}。可用方案: ${Object.keys(solutionRegistry).join(", ")}`,
      );
    }
    return solution;
  }
  return input;
}

/**
 * 按 phase 和 weight 排序 Project Plugins
 */
function sortProjectPlugins(plugins: IProjectPlugin[]): {
  pre: IProjectPlugin[];
  post: IProjectPlugin[];
} {
  const pre: IProjectPlugin[] = [];
  const post: IProjectPlugin[] = [];

  for (const plugin of plugins) {
    const phase = plugin.phase ?? "post";
    if (phase === "pre") {
      pre.push(plugin);
    } else {
      post.push(plugin);
    }
  }

  const byWeight = (a: IProjectPlugin, b: IProjectPlugin) =>
    (a.weight ?? 100) - (b.weight ?? 100);

  pre.sort(byWeight);
  post.sort(byWeight);

  return { pre, post };
}

/**
 * 导出源代码的主函数。
 * @description 接收 Schema，通过 Solution Pipeline 执行完整的出码流水线。
 * @param schema - 输入的低代码 Schema (ISchemaNode 数组)。
 * @param options - 导出选项。
 * @returns 包含导出结果的对象 (Promise<IExportResult>)。
 */
export async function exportSourceCode(
  schema: ISchema,
  options: IExportOptions = {},
): Promise<IExportResult> {
  const {
    solution: solutionInput = "react-vite",
    skipPublisher = false,
    projectName = "lowcode-project",
  } = options;

  try {
    // --- 0. 解析 Solution ---
    const solution = resolveSolution(solutionInput);
    console.log(`[CodeGenerator] 开始执行出码，使用解决方案: ${solution.name}`);

    // --- 1. Schema → IR ---
    const parser = new SchemaParser();
    const irProject = parser.parse(schema);
    const transformedIrProject = runPreprocessors(irProject);

    // --- 2. 初始化 ProjectBuilder ---
    const projectBuilder = new ProjectBuilder(transformedIrProject);

    // --- 3. 注入 Template 静态文件 ---
    const staticFiles = solution.template.getStaticFiles();
    for (const file of staticFiles) {
      projectBuilder.addFile(file);
    }
    console.log(
      `[CodeGenerator] 模板静态文件注入完毕 (${staticFiles.length} 个文件)`,
    );

    // --- 4. 按阶段排序 Project Plugins ---
    const { pre: prePlugins, post: postPlugins } = sortProjectPlugins(
      solution.projectPlugins,
    );

    // --- 5. 执行 Pre-phase Project Plugins ---
    for (const plugin of prePlugins) {
      plugin.run(projectBuilder);
    }

    // --- 6. 执行 Component Plugins（逐页面） ---
    transformedIrProject.pages.forEach((page: IRPage) => {
      const moduleBuilder = projectBuilder.createModuleBuilder();

      // 应用所有组件插件
      solution.componentPlugins.forEach((plugin) => {
        plugin.run(page, moduleBuilder, projectBuilder);
      });

      // 生成页面文件
      const componentName = page.fileName;
      const fileName = `${upperFirst(camelCase(componentName))}.tsx`;
      const componentPascalName = upperFirst(camelCase(componentName));
      const filePath = `src/pages/${componentPascalName}/${fileName}`;

      const content = moduleBuilder.generateModule(componentPascalName);
      projectBuilder.addFile({
        fileName,
        filePath,
        content,
        fileType: "tsx",
      });

      // 生成 CSS Module 文件 (如果需要)
      const cssContent = moduleBuilder.generateCssModule(componentPascalName);
      if (cssContent) {
        const cssFileName = `${componentPascalName}.module.scss`;
        const cssFilePath = `src/pages/${componentPascalName}/${cssFileName}`;
        projectBuilder.addFile({
          fileName: cssFileName,
          filePath: cssFilePath,
          content: cssContent,
          fileType: "scss",
        });
      }
    });
    console.log("[CodeGenerator] 组件代码生成完毕。");

    // --- 7. 执行 Post-phase Project Plugins ---
    for (const plugin of postPlugins) {
      plugin.run(projectBuilder);
    }
    console.log("[CodeGenerator] 项目级插件执行完毕。");

    // --- 8. 执行后处理器 ---
    if (solution.postProcessors.length > 0) {
      console.log("[CodeGenerator] 开始执行代码格式化...");
      await projectBuilder.applyPostProcessors(solution.postProcessors);
      console.log("[CodeGenerator] 代码格式化完成。");
    }

    // 获取最终文件列表
    const files = projectBuilder.generateFiles();

    // --- 9. 执行发布器 ---
    if (skipPublisher) {
      console.log("[CodeGenerator] 出码完成，返回内存中的文件列表。");
      return { success: true, files };
    }

    console.log(
      `[CodeGenerator] 开始发布，使用发布器: ${solution.publisher.name}`,
    );
    const publishResult = await solution.publisher.publish(files, {
      projectName,
    });
    console.log("[CodeGenerator] 发布完成。");

    return { success: true, publishResult };
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
      projectName: projectName,
    });

    if (
      result.success &&
      result.publishResult?.type === "blob" &&
      result.publishResult.blob
    ) {
      downloadBlob(result.publishResult.blob, `${projectName}.zip`);
    } else {
      throw new Error(result.message || "生成 ZIP 文件失败");
    }
  } catch (error: any) {
    console.error("[CodeGenerator] 导出并下载失败:", error);
    alert(`导出失败: ${error.message}`);
  }
}
