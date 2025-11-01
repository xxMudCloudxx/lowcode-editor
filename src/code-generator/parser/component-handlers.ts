// src/code-generator/parser/component-handlers.ts

import type {
  IRNode,
  IRPropValue,
  ISchemaNode,
  IRDependency,
  IRLiteral,
} from "../types/ir";
import { uniqueId } from "lodash-es";

/**
 * 定义解析器上下文
 * 允许 Handlers 访问 SchemaParser 的能力
 */
export interface IParserContext {
  pageDependencies: Set<IRDependency>;
  // 允许 handler 递归调用标准的 parseNode
  parseNode: (schemaNode: ISchemaNode) => IRNode;
  // 允许 handler 调用标准的 parsePropValue
  parsePropValue: (
    key: string,
    value: any,
    schemaNode: ISchemaNode
  ) => IRPropValue;
}

// --- 1. Node Transformers (节点转换器) ---
// (返回 IRNode 则代表完全接管；返回 undefined 则继续执行默认逻辑)
export type NodeTransformer = (
  schemaNode: ISchemaNode,
  context: IParserContext
) => IRNode | undefined;

/**
 * Icon 组件的转换器
 * (逻辑直接从 schema-parser.ts 迁移)
 */
const iconTransformer: NodeTransformer = (schemaNode, context) => {
  if (schemaNode.name !== "Icon" || !schemaNode.props?.icon) {
    return undefined; // 不是我们要处理的 Icon，交还控制权
  }

  let iconName: string | undefined = undefined;
  const iconProp = schemaNode.props.icon;
  if (typeof iconProp === "string") {
    iconName = iconProp;
  }

  if (iconName) {
    const iconDependency: IRDependency = {
      package: "@ant-design/icons",
      version: "^5.0.0",
      destructuring: true,
      exportName: iconName,
    };
    context.pageDependencies.add(iconDependency); // 使用上下文添加依赖

    const irNode: IRNode = {
      id: schemaNode.id || uniqueId("node_"),
      componentName: iconName, // componentName 被改写
      props: {},
      dependency: iconDependency,
      styles: schemaNode.styles,
    };

    // 复用上下文中的 parsePropValue
    if (schemaNode.props) {
      for (const key in schemaNode.props) {
        if (key === "icon") continue; // 跳过 icon 属性
        if (Object.prototype.hasOwnProperty.call(schemaNode.props, key)) {
          const value = schemaNode.props[key];
          // 过滤掉原型链上的属性和无效属性
          if (
            key === "toString" &&
            typeof value === "string" &&
            value.includes("[native code]")
          ) {
            continue;
          }
          // 使用上下文的标准方法解析其他 props
          irNode.props[key] = context.parsePropValue(key, value, schemaNode);
        }
      }
    }
    return irNode; // 返回 IRNode，代表已完全处理
  }
  return undefined; // iconName 无效，交还控制权
};

// 注册表 1
export const nodeTransformerRegistry: Record<string, NodeTransformer> = {
  Icon: iconTransformer,
};

// --- 2. Node Mappers (节点映射器) ---
// (在默认 IRNode 创建后执行，用于微调)
export type NodeMapper = (irNode: IRNode, schemaNode: ISchemaNode) => void;

/**
 * Button 组件的映射器
 * (逻辑直接从 schema-parser.ts 迁移)
 */
const buttonMapper: NodeMapper = (irNode, schemaNode) => {
  if (irNode.props.text) {
    if (!irNode.children && !irNode.props.children) {
      irNode.props.children = irNode.props.text; // 将 text 转为 children prop
    } else {
      console.warn(
        `组件 '${schemaNode.name}' (ID: ${schemaNode.id}) ... (忽略 'text' 属性)。`
      );
    }
    delete irNode.props.text; // 删除原始 prop
  }
};

/**
 * Typography 组件的映射器
 * (逻辑直接从 schema-parser.ts 迁移)
 */
const typographyMapper: NodeMapper = (irNode, schemaNode) => {
  if (irNode.props.content) {
    if (!irNode.children && !irNode.props.children) {
      irNode.props.children = irNode.props.content;
    } else {
      console.warn(
        `组件 '${schemaNode.name}' (ID: ${schemaNode.id}) ... (忽略 'content' 属性)。`
      );
    }
    delete irNode.props.content;
  }
};

// 注册表 2
export const nodeMapperRegistry: Record<string, NodeMapper> = {
  Button: buttonMapper,
  Typography: typographyMapper,
};

// --- 3. Prop Mappers (属性映射器) ---
// (在 parsePropValue 内部执行，用于转换特定属性)
export type PropMapper = (
  value: any,
  key: string,
  schemaNode: ISchemaNode
) => IRPropValue | undefined;

/**
 * FormItem 组件的属性映射器
 * (逻辑直接从 schema-parser.ts 迁移)
 */
const formItemPropMapper: PropMapper = (value, key, schemaNode) => {
  // 特殊处理 FormItem 的 name 属性，如果它是数字，转为字符串
  if (
    schemaNode.name === "FormItem" &&
    key === "name" &&
    typeof value === "number"
  ) {
    return { type: "Literal", value: String(value) } as IRLiteral;
  }
  return undefined; // 未处理，交还控制权
};

// 注册表 3
export const propMapperRegistry: Record<string, PropMapper> = {
  FormItem: formItemPropMapper,
};
