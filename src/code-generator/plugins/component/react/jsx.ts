// src/code-generator/plugins/component/react/jsx.ts

/**
 * @file React JSX 生成插件
 * @description 负责将 IRNode 转换为 React TSX 代码字符串。
 */

// ! 修正：仅导入类型
import type { IRNode, IRPropValue } from "../../../types/ir";
import type { ModuleBuilder } from "../../../generator/module-builder";
// ! 修正：移除了未使用的 kebabCase，添加了使用的 uniqueId
import { isEmpty, camelCase, upperFirst, uniqueId } from "lodash-es";

/**
 * 代码生成器插件接口定义
 * (可以放到 src/code-generator/types/core.ts 或类似文件)
 */
export interface ICodeGeneratorPlugin {
  /** 插件类型 */
  type: "component" | "project" | "postprocessor" | "publisher";
  /** 插件名称 */
  name: string;
  /**
   * 插件执行函数
   * @param irNode - 当前处理的 IR 节点 (对于 component 类型插件)。
   * @param moduleBuilder - 当前模块的构建器实例。
   */
  run: (irNode: IRNode, moduleBuilder: ModuleBuilder) => void;
}

/**
 * React JSX 生成插件实现
 */
const jsxPlugin: ICodeGeneratorPlugin = {
  type: "component",
  name: "react-jsx",
  /**
   * 执行 JSX 生成逻辑。
   * @param irNode - 页面或组件的根 IRNode。
   * @param moduleBuilder - 当前模块的构建器实例。
   */
  run: (irNode: IRNode, moduleBuilder: ModuleBuilder) => {
    // 递归生成 JSX 字符串，初始缩进级别为 0
    const jsxString = generateJSX(irNode, moduleBuilder, 0);
    // 将生成的 JSX 设置到 ModuleBuilder 中
    moduleBuilder.setJSX(jsxString);
  },
};

export default jsxPlugin;

// --- JSX 生成核心逻辑 ---

/**
 * 递归生成 JSX 字符串。
 * @param irNode - 当前要生成 JSX 的 IRNode。
 * @param moduleBuilder - 用于添加导入和方法的 ModuleBuilder 实例。
 * @param indentLevel - 当前的缩进级别。
 * @returns 生成的 JSX 字符串。
 */
function generateJSX(
  irNode: IRNode,
  moduleBuilder: ModuleBuilder,
  indentLevel: number
): string {
  // 计算当前行的缩进字符串 (基础缩进 + return 和根元素的 2 层)
  const indent = "  ".repeat(indentLevel + 2); // 使用 2 个空格作为缩进

  // 1. 处理组件导入并获取在代码中使用的名称
  const componentNameInCode = moduleBuilder.addImport(
    irNode.dependency,
    irNode.componentName
  );

  // 2. 处理 Props，生成属性字符串
  const propsString = generatePropsString(
    irNode.props,
    moduleBuilder,
    indentLevel + 1
  );

  // 3. 处理 Children
  let childrenString = "";
  if (irNode.children && irNode.children.length > 0) {
    // 如果有子 IRNode 数组，递归生成它们的 JSX
    childrenString = irNode.children
      .map((child) => generateJSX(child, moduleBuilder, indentLevel + 1)) // 递归子节点，增加缩进
      .join("\n");
  } else if (
    irNode.props.children &&
    // ! 修正：在访问 .type 之前，确保它是对象且有 'type' 属性
    typeof irNode.props.children === "object" &&
    irNode.props.children !== null &&
    !Array.isArray(irNode.props.children) &&
    "type" in irNode.props.children && // 检查 'type' 属性是否存在
    irNode.props.children.type === "Literal"
  ) {
    // 特殊情况：如果 children 是通过 props 传递的字面量 (例如 Button 的 text 转化而来)

    // ! 修正：在类型守卫内部，TypeScript 知道 irNode.props.children 具有 'type' 属性，
    // 并且因为 type === 'Literal'，它也应该有 'value' 属性。
    const childValue = (
      irNode.props.children as { type: "Literal"; value: any }
    ).value;

    if (typeof childValue === "string" || typeof childValue === "number") {
      childrenString = `${indent}  ${JSON.stringify(childValue)}`; // 增加缩进
    } else if (
      typeof childValue === "boolean" ||
      childValue === null ||
      childValue === undefined
    ) {
      // 对于 boolean/null/undefined，React 不会渲染任何内容，所以 childrenString 保持为空
      childrenString = "";
    } else {
      // 对于对象或数组等复杂类型，可能需要特殊处理或警告
      console.warn(
        `无法直接渲染 Literal 类型的 children (非字符串/数字): `,
        childValue
      );
      childrenString = `${indent}  {/* Cannot render complex children literal */}`;
    }
    // 从 props 中移除，避免在 generatePropsString 中重复处理
    delete irNode.props.children;
  }

  // 4. 处理 Styles (生成内联样式对象字符串)
  const styleString = generateStyleString(irNode.styles);
  // 如果存在样式，生成 style={{...}} 属性
  const styleProp = styleString ? ` style={${styleString}}` : "";

  // 5. 组合 JSX 字符串
  if (childrenString) {
    // 如果有子节点或有效的文本子节点，使用开合标签形式
    return `${indent}<${componentNameInCode}${propsString}${styleProp}>\n${childrenString}\n${indent}</${componentNameInCode}>`;
  } else {
    // 如果没有子节点，使用自闭合标签形式
    return `${indent}<${componentNameInCode}${propsString}${styleProp} />`;
  }
}

/**
 * 生成组件的属性字符串 (e.g., `prop1="value1" prop2={value2}`)。
 * @param props - IRNode 的 props 对象。
 * @param moduleBuilder - ModuleBuilder 实例。
 * @param indentLevel - 当前缩进级别 (用于多行属性格式化)。
 * @returns 格式化后的属性字符串 (包含前导空格)，如果无有效属性则返回空字符串。
 */
function generatePropsString(
  props: Record<string, IRPropValue>,
  moduleBuilder: ModuleBuilder,
  indentLevel: number
): string {
  const propStrings: string[] = [];
  // 多行属性的缩进
  const multiLineIndent = "  ".repeat(indentLevel + 1);

  // 遍历所有 props
  for (const key in props) {
    // 忽略 children prop，它在 generateJSX 中单独处理
    if (key === "children") {
      continue;
    }

    const propValue = props[key];
    // 生成属性值的字符串表示 (带引号或花括号)
    const propStringValue = generatePropValueString(propValue, moduleBuilder);

    // 只有当属性值有效时才添加到字符串数组
    if (propStringValue !== undefined) {
      // ! 修正：在访问 .type 和 .value 之前进行严格的类型检查
      // 检查 propValue 是否是具有 'type' 属性的对象（排除了 IRNode 和 IRNode[]）
      if (
        typeof propValue === "object" &&
        propValue !== null &&
        !Array.isArray(propValue) &&
        "type" in propValue &&
        propValue.type === "Literal" &&
        "value" in propValue && // 确保有 'value' 属性
        typeof propValue.value === "boolean"
      ) {
        if (propValue.value) {
          // 现在访问 propValue.value 是安全的
          propStrings.push(`${key}`); // 对于 true 的布尔属性，只写属性名
        } else {
          // 对于 false 的布尔属性，需要显式写出 {false}
          propStrings.push(`${key}={${propStringValue}}`);
        }
      } else {
        // 其他类型属性使用 key={value} 格式
        propStrings.push(`${key}={${propStringValue}}`);
      }
    }
  }

  // 如果没有有效属性，返回空字符串
  if (propStrings.length === 0) {
    return "";
  }

  // 简单的格式化：如果属性字符串太长，进行换行处理
  const singleLineProps = " " + propStrings.join(" ");
  if (singleLineProps.length > 80) {
    // 阈值可调整
    // 换行格式：每个属性占一行，并进行缩进
    return (
      `\n${multiLineIndent}` +
      propStrings.join(`\n${multiLineIndent}`) +
      `\n${"  ".repeat(indentLevel)}` // 结束标签前的换行
    );
  } else {
    // 单行格式
    return singleLineProps;
  }
}

/**
 * 将 IRPropValue 转换为 JSX 属性值所需的字符串。
 * @param propValue - 要转换的 IRPropValue 对象。
 * @param moduleBuilder - ModuleBuilder 实例，用于添加方法等。
 * @returns 属性值的字符串表示 (不包含属性名和等号)，如果类型不支持则返回 undefined。
 */
function generatePropValueString(
  propValue: IRPropValue,
  moduleBuilder: ModuleBuilder
): string | undefined {
  // ! 修正：开始严格的类型检查

  // 1. 检查是否为 IRNode[] (Slot 数组)
  if (Array.isArray(propValue)) {
    // TODO: 阶段二需要处理的类型
    // 返回包含多个 JSX 节点的数组字符串
    //  return `[
    //    ${propValue.map(node => generateJSX(node, moduleBuilder, 1)).join(',\n')}
    //  ]`;
    console.warn(
      "IRNode[] (Array Slot) prop type not yet supported.",
      propValue
    );
    return undefined;
  }

  // 2. 检查是否为 null 或非对象 (虽然 ts-check 应该会发现，但以防万一)
  if (typeof propValue !== "object" || propValue === null) {
    // 这可能是一个无效的 IRPropValue，或者是一个未被正确包装的原始类型
    // 在我们的定义中，IRPropValue 总是对象或数组
    console.warn("Invalid IRPropValue: must be an object or array.", propValue);
    return undefined;
  }

  // 3. 检查 'type' 属性是否存在
  if ("type" in propValue) {
    // 3a. 它有 'type' 属性，所以它必须是 (IRLiteral | IRVariable | IRJSExpression | IRJSFunction | IRAction)
    // TypeScript 现在可以将 propValue 正确地收窄
    switch (propValue.type) {
      case "Literal":
        // propValue 被收窄为 IRLiteral (有 value)
        if (
          typeof propValue.value === "object" &&
          propValue.value !== null &&
          !Array.isArray(propValue.value)
        ) {
          // 生成形如 { key1: value1, key2: value2 } 的字符串
          const objStr = Object.entries(propValue.value)
            .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`) // 假设对象内部值都是简单类型
            .join(", ");
          return `{${objStr}}`; // 返回 { key: "value" } 格式
        }
        // 其他字面量
        return JSON.stringify(propValue.value);

      case "Action":
        // propValue 被收窄为 IRAction (有 actionType 和 config)
        const handlerName = `handle${upperFirst(
          camelCase(propValue.actionType || "action")
        )}${propValue.config.componentId || uniqueId("Action")}`;
        // 在 ModuleBuilder 中添加一个 TODO 注释的方法体
        const methodBody = `
    /**
     * TODO: 实现动作处理逻辑
     * Action Type: ${propValue.actionType}
     * Config: ${JSON.stringify(propValue.config)}
     */
    const ${handlerName} = () => {
      console.log('Action triggered: ${propValue.actionType}', ${JSON.stringify(
          propValue.config
        )});
    };`;
        moduleBuilder.addMethod(methodBody);
        return handlerName;

      // --- 阶段二需要处理的类型 ---
      case "JSExpression":
        // propValue 被收窄为 IRJSExpression (有 value)
        return propValue.value;
      case "JSFunction":
        // propValue 被收窄为 IRJSFunction (有 value)
        return propValue.value;
      case "Variable":
        // propValue 被收窄为 IRVariable (有 name)
        return propValue.name;

      default:
        // 处理 'type' 存在但未被识别的情况
        console.warn(
          `Unrecognized IRPropValue type: ${
            (propValue as any).type
          }. Skipping prop.`
        );
        return undefined;
    }
  }

  // 4. 检查是否为 IRNode (单个 Slot)
  // 如果它是一个对象，不是数组，且没有 'type' 属性，那么它必须是 IRNode
  if ("componentName" in propValue) {
    // propValue 被收窄为 IRNode
    // TODO: 阶段二需要处理的类型
    // 返回被括号包裹的 JSX 字符串
    // return `(${generateJSX(propValue as IRNode, moduleBuilder, 0)})`;
    console.warn(
      "IRNode (Single Slot) prop type not yet supported.",
      propValue
    );
    return undefined;
  }

  // --- 默认 Fallback ---
  // 如果 propValue 是一个未知结构的对象
  console.warn(
    `Unknown object in IRPropValue (not array, no type, no componentName): ${JSON.stringify(
      propValue
    )}. Skipping prop.`
  );
  return undefined;
}

/**
 * 将样式对象转换为 React 内联样式所需的字符串对象。
 * @param styles - IRNode 中的 styles 对象。
 * @returns React style 属性接受的对象字符串 (e.g., `{"backgroundColor":"red","fontSize":"12px"}`)，
 * 如果 styles 为空或无效则返回 undefined。
 */
function generateStyleString(
  styles?: Record<string, string>
): string | undefined {
  // 如果 styles 不存在或为空对象，则返回 undefined
  if (!styles || isEmpty(styles)) {
    return undefined;
  }
  const styleObject: Record<string, string> = {};
  // 遍历原始样式对象
  for (const key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      // 将 CSS 属性名转换为驼峰式 (e.g., background-color -> backgroundColor)
      styleObject[camelCase(key)] = styles[key];
    }
  }
  // 将处理后的样式对象转换为 JSON 字符串
  return JSON.stringify(styleObject);
}
