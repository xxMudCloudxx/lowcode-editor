// src/code-generator/solutions/react-vite.ts

/**
 * @file React + Vite 出码解决方案
 * @description 定义了使用 React 和 Vite 技术栈生成代码的流水线 (Pipeline)。
 */

import type { ISchema, IRNode } from "../types/ir";
import { SchemaParser } from "../parser/schema-parser";
import { ProjectBuilder } from "../generator/project-builder";
import jsxPlugin from "../plugins/component/react/jsx";
import { camelCase, upperFirst } from "lodash";
import type {
  IComponentPlugin,
  IPostProcessor,
  IProjectPlugin,
} from "../types/plugin";
import { projectPlugins } from "../plugins/project";
import cssPlugin from "../plugins/component/style/css";
import { prettierPostProcessor } from "../postprocessor/prettier";
// 引入其他插件... (例如 CSS 插件, 路由插件等，将在后续阶段添加)

/**
 * 代码生成解决方案接口
 */
export interface ICodeGeneratorSolution {
  /**
   * 执行代码生成流水线。
   * @param schema - 输入的低代码 Schema。
   * @returns 包含生成结果的 ProjectBuilder 实例。
   */
  run: (schema: ISchema) => Promise<ProjectBuilder>;
}

/**
 * React + Vite 解决方案的具体实现。
 * 支持插件流水线
 */
const reactViteSolution: ICodeGeneratorSolution = {
  run: async (schema: ISchema) => {
    // 1. 解析 Schema -> IR (Intermediate Representation)
    const parser = new SchemaParser();
    const irProject = parser.parse(schema);

    // 2. 初始化 ProjectBuilder，传入 IR
    const projectBuilder = new ProjectBuilder(irProject);

    // 3. --- 定义插件流水线 ---
    // 阶段一：组件级别插件
    const componentPlugins: IComponentPlugin[] = [cssPlugin, jsxPlugin];

    // 阶段二/三：项目级别插件
    const projectPluginsList: IProjectPlugin[] = [
      ...projectPlugins,
      // 未来可以添加 packageJsonPlugin, viteConfigPlugin 等
      // packageJsonPlugin,
      // viteConfigPlugin,
    ];

    // 4. --- 执行组件插件流水线 (Pipeline) ---
    irProject.pages.forEach((page) => {
      // 为每个页面创建一个 ModuleBuilder
      const moduleBuilder = projectBuilder.createModuleBuilder();

      // --- 遍历 IRNode 并应用 Component 级别的插件 ---
      function traverseNode(irNode: IRNode) {
        // 应用所有组件插件
        componentPlugins.forEach((plugin) => {
          plugin.run(irNode, moduleBuilder, projectBuilder);
        });

        // (注意：jsxPlugin 内部已处理递归，
        // 如果其他插件 (如 cssPlugin) 需要不同方式遍历，需调整此逻辑)
      }

      // 从页面的根节点开始遍历
      traverseNode(page.node);

      // --- 生成当前页面的文件 ---
      const componentName = page.fileName;
      const fileName = `${upperFirst(camelCase(componentName))}.tsx`; // 统一命名为 PascalCase
      const componentPascalName = upperFirst(camelCase(componentName));
      const filePath = `src/pages/${componentPascalName}/${fileName}`;

      // 调用 moduleBuilder 生成最终的代码字符串
      const content = moduleBuilder.generateModule(componentPascalName);

      // 将生成的文件内容添加到 ProjectBuilder
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

    // 5. --- 执行 Project 级别的插件 ---
    projectPluginsList.forEach((plugin) => {
      plugin.run(projectBuilder);
    });

    // 6. --- 阶段四：执行后处理器 (Post-processors) ---
    const postProcessors: IPostProcessor[] = [prettierPostProcessor()];

    // ↓↓↓ 核心修改点：await 异步的后处理方法 ↓↓↓
    await projectBuilder.applyPostProcessors(postProcessors);

    // 7. 返回填充了文件结果的 ProjectBuilder
    return projectBuilder;
  },
};

export default reactViteSolution;
