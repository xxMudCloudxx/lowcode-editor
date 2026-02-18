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
  IRJSExpression,
  IRJSFunction,
} from "@lowcode/schema";
// 确认从 ./component-metadata 导入辅助函数
import {
  getComponentMetadata,
  getAllDependencies,
  getProjectDependencies,
} from "./component-metadata";
// 导入 componentMetadataMap 用于 getAllDependencies 函数
import { componentMetadataMap } from "../const/component-metadata";
import { uniqueId } from "lodash-es";
import {
  nodeMapperRegistry,
  nodeTransformerRegistry,
  propMapperRegistry,
  type IParserContext,
} from "./component-handlers";

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
    const transformer = Object.prototype.hasOwnProperty.call(
      nodeTransformerRegistry,
      schemaNode.name,
    )
      ? nodeTransformerRegistry[schemaNode.name]
      : undefined;
    if (transformer) {
      const context: IParserContext = {
        pageDependencies: this.pageDependencies,
        parseNode: this.parseNode.bind(this),
        parsePropValue: this.parsePropValue.bind(this),
      };
      const result = transformer(schemaNode, context);
      if (result) {
        return result;
      }
    }
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

    const mapper = Object.prototype.hasOwnProperty.call(
      nodeMapperRegistry,
      schemaNode.name,
    )
      ? nodeMapperRegistry[schemaNode.name]
      : undefined;
    if (mapper) {
      mapper(irNode, schemaNode);
    }

    // --- 解析 Children ---
    if (schemaNode.children && schemaNode.children.length > 0) {
      // 递归调用 parseNode 处理每个子节点
      irNode.children = schemaNode.children.map((child) =>
        this.parseNode(child),
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
    schemaNode: ISchemaNode,
  ): IRPropValue {
    // 步骤 1: (高优先级) 运行“组件特定”处理器 (e.g., FormItem)
    const propMapper = Object.prototype.hasOwnProperty.call(
      propMapperRegistry,
      schemaNode.name,
    )
      ? propMapperRegistry[schemaNode.name]
      : undefined;

    if (propMapper) {
      const result = propMapper(value, key, schemaNode);
      if (result) {
        return result; // 组件特定处理器已处理 (e.g., FormItem.name)
      }
    }

    // 步骤 2: (中优先级) 基于 "值结构" (Value Structure) 进行全局解析

    // 2a. 检查是否为 Action 结构
    // (不再检查 key === 'onClick'，自动支持所有 { actions: [...] } 结构的事件)
    if (
      typeof value === "object" &&
      value !== null &&
      Array.isArray(value.actions) // [!> 关键检查 <!]
    ) {
      return this.parseActionProp(value, key, schemaNode);
    }

    // 2b. 检查是否为 JSExpression / JSFunction 结构
    if (typeof value === "object" && value !== null && "type" in value) {
      switch (value.type) {
        case "JSExpression":
          return this.parseJSExpressionProp(value, key, schemaNode);
        case "JSFunction":
          return this.parseJSFunctionProp(value, key, schemaNode);
      }
    }

    // 步骤 3: (低优先级) Fallback (默认作为 Literal)
    // (所有不符合上述结构的，包括 'onSale' (boolean),
    //  'title' (string), 'data' (array) 都会落到这里)
    return this.parseLiteralProp(value, key, schemaNode);
  }

  // --- 私有辅助方法 ---
  // (这些方法是为 parsePropValue 服务的)

  /**
   * 辅助方法：解析 Action 类型的属性
   * (逻辑迁移自原 的 'onClick' 块)
   */
  private parseActionProp(
    value: any,
    key: string,
    schemaNode: ISchemaNode,
  ): IRPropValue {
    const actions: IRAction[] = value.actions
      .map((action: any) => {
        if (action && action.type && action.config) {
          return {
            type: "Action",
            actionType: action.type,
            config: action.config,
          } as IRAction;
        }
        return null;
      })
      .filter((action: any): action is IRAction => !!action);

    if (actions.length === 0) {
      console.warn(
        `在组件 '${schemaNode.name}' (ID: ${schemaNode.id}) 的 '${key}' 属性中发现无效的 action 结构。`,
      );
      return { type: "Literal", value: null } as IRLiteral;
    }

    // 如果只有一个 action，返回单个 IRAction，否则返回数组
    return actions.length === 1 ? actions[0] : actions;
  }

  /**
   * 辅助方法：解析 JSExpression 类型的属性
   * (逻辑迁移自原)
   */
  private parseJSExpressionProp(
    value: any,
    key: string,
    schemaNode: ISchemaNode,
  ): IRPropValue {
    if (typeof value.value === "string") {
      return {
        type: "JSExpression",
        value: value.value,
      } as IRJSExpression;
    }

    console.warn(
      `属性 '${key}' (在 ${schemaNode.name}) 的值结构不是一个有效的 JSExpression。将降级为 Literal。`,
    );
    return this.parseLiteralProp(value, key, schemaNode); // 降级为字面量
  }

  /**
   * 辅助方法：解析 JSFunction 类型的属性
   * (逻辑迁移自原)
   */
  private parseJSFunctionProp(
    value: any,
    key: string,
    schemaNode: ISchemaNode,
  ): IRPropValue {
    if (typeof value.value === "string") {
      return {
        type: "JSFunction",
        value: value.value,
      } as IRJSFunction;
    }

    console.warn(
      `属性 '${key}' (在 ${schemaNode.name}) 的值结构不是一个有效的 JSFunction。将降级为 Literal。`,
    );
    return this.parseLiteralProp(value, key, schemaNode); // 降级为字面量
  }

  /**
   * 辅助方法：解析字面量
   * (聚合原 的 fallback 逻辑)
   */
  private parseLiteralProp(
    value: any,
    key: string,
    schemaNode: ISchemaNode,
  ): IRLiteral {
    // 1. 处理简单字面量
    if (
      ["string", "number", "boolean"].includes(typeof value) ||
      value === null ||
      value === undefined
    ) {
      return { type: "Literal", value: value } as IRLiteral;
    }

    // 2. 处理对象和数组字面量
    if (typeof value === "object") {
      try {
        // 使用 JSON.parse(JSON.stringify(...)) 进行简单的深拷贝
        return {
          type: "Literal",
          value: JSON.parse(JSON.stringify(value)),
        } as IRLiteral;
      } catch (e) {
        console.error(
          `无法序列化属性 '${key}' (在组件 ${schemaNode.name} ID: ${schemaNode.id}) 的对象值: `,
          value,
          e,
        );
        return { type: "Literal", value: null } as IRLiteral;
      }
    }

    // 3. Fallback (其他未能识别的类型)
    console.warn(
      `在组件 '${schemaNode.name}' (ID: ${schemaNode.id}) 的属性 '${key}' 中发现无法识别的值类型。已将其视为 Literal 处理。值:`,
      value,
    );
    return { type: "Literal", value: value } as IRLiteral;
  }
}
