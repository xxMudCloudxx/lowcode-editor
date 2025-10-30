// src/code-generator/parser/schema-parser.ts

/**
 * @file Schema 解析器
 * @description 负责将输入的低代码 Schema 转换为内部使用的中间表示 (IR)。
 */

import type {
  ISchema,
  ISchemaNode,
  IRProject,
  IRPage,
  IRNode,
  IRPropValue,
  IRLiteral,
  IRAction,
  IRDependency,
} from "../types/ir";
// 确认从 ./component-metadata 导入辅助函数
import {
  getComponentMetadata,
  getAllDependencies,
  getProjectDependencies,
} from "./component-metadata";
// 导入 componentMetadataMap 用于 getAllDependencies 函数
import { componentMetadataMap } from "../const/component-metadata";
import { uniqueId } from "lodash-es";

/**
 * Schema 解析器类
 */
export class SchemaParser {
  /**
   * @private
   * @description 用于收集当前正在解析的页面的依赖项集合
   */
  private pageDependencies: Set<IRDependency>;

  constructor() {
    this.pageDependencies = new Set();
  }

  /**
   * 解析整个 Schema 并生成 IRProject 对象。
   * @param schema - 输入的低代码 Schema 数组。
   * @returns 解析后的 IRProject 对象。
   */
  parse(schema: ISchema): IRProject {
    const project: IRProject = {
      pages: [],
      dependencies: {}, // 先置空，后面聚合
    };

    // --- 重要假设：目前只处理 schema 数组的第一个元素作为单页面 ---
    // 需要根据实际情况调整如何处理多页面或页面选择逻辑
    if (schema && schema.length > 0) {
      // 查找根节点 (通常是 'Page')
      const rootSchemaNode =
        schema.find((node) => node.name === "Page") || schema[0]; // 容错处理，取第一个
      if (rootSchemaNode) {
        const page = this.parsePage(rootSchemaNode, "index"); // 假设页面文件名为 index
        project.pages.push(page);
      } else {
        // 使用 warn 级别的日志记录，避免中断流程
        console.warn("未能在 Schema 中找到根节点 (例如 'Page')。");
      }
    } else {
      console.warn("输入的 Schema 为空。");
    }

    // --- 聚合项目依赖 ---
    // 从组件元数据中获取所有可能的依赖
    const allDepsArray = getAllDependencies(componentMetadataMap);
    // 转换为 package.json 需要的格式
    project.dependencies = getProjectDependencies(allDepsArray);

    return project;
  }

  /**
   * 解析单个页面 Schema。
   * @param rootSchemaNode - 页面的根 Schema 节点。
   * @param fileName - 期望生成的页面文件名 (不含扩展名)。
   * @returns 解析后的 IRPage 对象。
   */
  private parsePage(rootSchemaNode: ISchemaNode, fileName: string): IRPage {
    this.pageDependencies.clear(); // 为新页面清空依赖收集器
    const rootIrNode = this.parseNode(rootSchemaNode);
    return {
      id: rootSchemaNode.id || uniqueId("page_"), // 如果 id 不存在，生成唯一 ID
      fileName: fileName,
      node: rootIrNode,
      dependencies: Array.from(this.pageDependencies), // 将 Set 转为 Array
    };
  }

  /**
   * 递归解析 Schema 节点及其子节点。
   * @param schemaNode - 当前要解析的 Schema 节点。
   * @returns 解析后的 IRNode 对象。
   */
  private parseNode(schemaNode: ISchemaNode): IRNode {
    // getComponentMetadata 内部会使用 componentMetadataMap
    const metadata = getComponentMetadata(schemaNode.name);
    if (!metadata) {
      // 对于无法识别的组件，打印错误日志并返回一个占位 div 节点
      console.error(`未找到组件 '${schemaNode.name}' 的元数据定义。`);
      // 返回一个基础 div 节点作为容错处理
      return {
        id: schemaNode.id || uniqueId("unknown_"),
        componentName: "div", // 使用 'div' 作为未知组件的 fallback
        props: {
          // 将未识别信息添加到 props 中，便于调试
          "data-unknown-component": { type: "Literal", value: schemaNode.name },
          children: {
            type: "Literal",
            value: `Unknown Component: ${schemaNode.name}`,
          },
        },
        dependency: { package: "", destructuring: false }, // 无依赖
        // 尝试递归解析子节点，即使父节点未知
        children: schemaNode.children
          ? schemaNode.children.map((child) => this.parseNode(child))
          : [],
      };
    }

    // 将当前组件的依赖添加到页面依赖集合中
    this.pageDependencies.add(metadata.dependency);

    const irNode: IRNode = {
      id: schemaNode.id || uniqueId("node_"),
      componentName: metadata.componentName, // 使用元数据中的 componentName (可能与 schemaNode.name 不同，如 Grid -> Row)
      props: {},
      dependency: metadata.dependency,
      styles: schemaNode.styles, // 直接复制样式对象
      // css 字段由 CSS 插件处理
    };

    // --- 解析 Props ---
    if (schemaNode.props) {
      for (const key in schemaNode.props) {
        // 使用 Object.prototype.hasOwnProperty.call 确保是自身属性而非原型链属性
        if (Object.prototype.hasOwnProperty.call(schemaNode.props, key)) {
          const value = schemaNode.props[key];
          // 过滤掉原型链上的属性和无效属性 (例如 JSON 序列化时可能产生的 toString)
          if (
            key === "toString" &&
            typeof value === "string" &&
            value.includes("[native code]")
          ) {
            continue;
          }
          // 解析属性值并存入 IRNode
          irNode.props[key] = this.parsePropValue(key, value, schemaNode);
        }
      }
    }

    // --- 特殊处理 Button 的 text 属性到 children ---
    // 这是根据我的 Schema 做的适配，如果 Button 的文本在 props.text 而不是 children
    if (schemaNode.name === "Button" && irNode.props.text) {
      // 检查 Button 是否已有 children，避免覆盖 (虽然通常 Button 不会有 children 和 text 同时存在)
      if (!irNode.children && !irNode.props.children) {
        irNode.props.children = irNode.props.text; // 将 text 转为 children prop
      } else {
        console.warn(
          `组件 '${schemaNode.name}' (ID: ${schemaNode.id}) 同时具有 'text' 属性和子节点/children 属性，已忽略 'text' 属性。`
        );
      }
      delete irNode.props.text; // 删除原始的 text prop
    }
    // --- 特殊处理 Typography 的 content 属性到 children ---
    if (schemaNode.name === "Typography" && irNode.props.content) {
      if (!irNode.children && !irNode.props.children) {
        irNode.props.children = irNode.props.content;
      } else {
        console.warn(
          `组件 '${schemaNode.name}' (ID: ${schemaNode.id}) 同时具有 'content' 属性和子节点/children 属性，已忽略 'content' 属性。`
        );
      }
      delete irNode.props.content;
    }

    // --- 解析 Children ---
    if (schemaNode.children && schemaNode.children.length > 0) {
      // 递归调用 parseNode 处理每个子节点
      irNode.children = schemaNode.children.map((child) =>
        this.parseNode(child)
      );
    }

    return irNode;
  }

  /**
   * 解析单个属性的值，将其转换为对应的 IRPropValue 类型。
   * @param key - 属性的键名。
   * @param value - 属性的原始值。
   * @param schemaNode - 当前属性所属的 Schema 节点 (用于特定组件的特殊处理)。
   * @returns 解析后的 IRPropValue 对象。
   */
  private parsePropValue(
    key: string,
    value: any,
    schemaNode: ISchemaNode
  ): IRPropValue {
    // 1. 处理 onClick Action (根据我的 Schema 结构)
    // 检查是否是对象、非 null，且包含 actions 数组
    if (
      key === "onClick" &&
      typeof value === "object" &&
      value !== null &&
      Array.isArray(value.actions)
    ) {
      // 简化处理：假设只有一个 action
      if (value.actions.length > 0) {
        const action = value.actions[0];
        // 确保 action 结构符合预期
        if (action && action.type && action.config) {
          return {
            type: "Action",
            actionType: action.type, // e.g., 'componentMethod'
            config: action.config,
          } as IRAction;
        }
      }
      // 如果没有 action 或结构不符，返回 null 字面量
      console.warn(
        `在组件 '${schemaNode.name}' (ID: ${schemaNode.id}) 的 onClick 属性中发现无效的 action 结构。`
      );
      return { type: "Literal", value: null } as IRLiteral;
    }

    // 2. 处理简单字面量 (string, number, boolean, null, undefined)
    if (
      ["string", "number", "boolean"].includes(typeof value) ||
      value === null ||
      value === undefined
    ) {
      // 特殊处理 FormItem 的 name 属性，如果它是数字，转为字符串
      // 这种特定组件的逻辑耦合较高，未来可考虑通过组件元数据配置或插件化方式解耦
      if (
        schemaNode.name === "FormItem" &&
        key === "name" &&
        typeof value === "number"
      ) {
        return { type: "Literal", value: String(value) } as IRLiteral;
      }
      // 默认返回 Literal 类型
      return { type: "Literal", value: value } as IRLiteral;
    }

    // 3. 处理数组和普通对象 (递归处理其内部值，但在这个阶段简化，直接认为是 Literal)
    // TODO: 未来需要更精细地处理对象和数组内部可能包含的 JSExpression, JSFunction 等
    if (typeof value === "object") {
      try {
        // 使用 JSON.parse(JSON.stringify(...)) 进行简单的深拷贝，确保值的独立性
        // 注意：这种方式会丢失函数、undefined、Date 对象等特殊类型
        // 如果属性值中可能包含这些类型，需要更完善的深拷贝实现
        return {
          type: "Literal",
          value: JSON.parse(JSON.stringify(value)),
        } as IRLiteral;
      } catch (e) {
        console.error(
          `无法序列化属性 '${key}' (在组件 ${schemaNode.name} ID: ${schemaNode.id}) 的对象值: `,
          value,
          e
        );
        // 序列化失败时返回 null
        return { type: "Literal", value: null } as IRLiteral;
      }
    }

    // 对于其他未能识别的类型，打印警告并暂时作为 Literal 处理
    console.warn(
      `在组件 '${schemaNode.name}' (ID: ${schemaNode.id}) 的属性 '${key}' 中发现无法识别的值类型。已将其视为 Literal 处理。值:`,
      value
    );
    return { type: "Literal", value: value } as IRLiteral;
  }
}
