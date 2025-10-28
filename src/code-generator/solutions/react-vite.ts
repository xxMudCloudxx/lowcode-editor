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
  run: (schema: ISchema) => ProjectBuilder;
}

/**
 * React + Vite 解决方案的具体实现。
 */
const reactViteSolution: ICodeGeneratorSolution = {
  run: (schema: ISchema) => {
    // 1. 解析 Schema -> IR (Intermediate Representation)
    const parser = new SchemaParser();
    const irProject = parser.parse(schema);

    // 2. 初始化 ProjectBuilder，传入 IR
    const projectBuilder = new ProjectBuilder(irProject);

    // 3. 执行插件流水线 (Pipeline)
    // 阶段一：只处理页面组件的 JSX 生成
    irProject.pages.forEach((page) => {
      // 为每个页面创建一个 ModuleBuilder
      const moduleBuilder = projectBuilder.createModuleBuilder();

      // --- 遍历 IRNode 并应用 Component 级别的插件 ---
      // 定义一个递归函数来遍历节点树 (虽然在此阶段 jsxPlugin 内部已处理递归，但保留结构以备将来扩展)
      function traverseNode(irNode: IRNode) {
        // 应用 JSX 插件来生成 JSX 并添加到 moduleBuilder
        jsxPlugin.run(irNode, moduleBuilder); // 注意：这里简化了调用方式

        // 如果需要对子节点应用其他 component 插件，可以在这里递归
        // if (irNode.children) {
        //   irNode.children.forEach(traverseNode);
        // }
      }
      // 从页面的根节点开始遍历
      traverseNode(page.node);

      // --- 生成当前页面的文件 ---
      // 调用 moduleBuilder 生成最终的代码字符串
      const componentName = page.fileName; // 使用文件名作为组件名基础
      const fileName = `${componentName}.tsx`;
      // 定义统一的文件输出路径结构，例如 src/pages/PageName/PageName.tsx
      const filePath = `src/pages/${upperFirst(
        camelCase(componentName)
      )}/${fileName}`;
      const content = moduleBuilder.generateModule(componentName);

      // 将生成的文件内容添加到 ProjectBuilder
      projectBuilder.addFile({
        fileName,
        filePath,
        content,
        fileType: "tsx",
      });

      // (未来阶段) 在这里可以调用 CSS 插件生成页面的 CSS Module 文件等
      // cssPlugin.run(page, projectBuilder, moduleBuilder); // 示例调用
    });

    // --- 执行 Project 级别的插件 ---
    // 阶段二、三会在这里添加插件，例如：
    // routerPlugin.run(projectBuilder);
    // globalStylePlugin.run(projectBuilder);
    // packageJsonPlugin.run(projectBuilder);
    // viteConfigPlugin.run(projectBuilder);
    // ...

    // 4. 返回填充了文件结果的 ProjectBuilder
    return projectBuilder;
  },
};

export default reactViteSolution;
