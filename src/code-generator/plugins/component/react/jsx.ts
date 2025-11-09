// src/code-generator/plugins/component/react/jsx.ts

/**
 * @file React JSX 生成插件
 * @description 负责将 IRNode 转换为 React TSX 代码字符串。
 */

import type { IRAction, IRNode, IRPage, IRPropValue } from "../../../types/ir";
import type { ModuleBuilder } from "../../../generator/module-builder";
import { camelCase, upperFirst, uniqueId } from "lodash-es";
import { getActionHandler } from "./handlers/actions";
import type { IComponentPlugin } from "../../../types/plugin";
import { getComponentCodeGenMeta } from "../../../const/component-metadata";

/**
 * 生成单条 Action 的核心调用代码字符串
 * @param action
 * @param moduleBuilder
 * @returns {string} - e.g., "message.info('hello')"
 */
function generateActionCallString(
  action: IRAction,
  moduleBuilder: ModuleBuilder
): string {
  // 1. 获取处理器
  const handler = getActionHandler(action.actionType);

  // 2. 执行处理器
  return handler(action, moduleBuilder);
}

/**
 * React JSX 生成插件实现
 */
const jsxPlugin: IComponentPlugin = {
  type: "component",
  name: "react-jsx",
  /**
   * 执行 JSX 生成逻辑。
   * @param page - 页面。
   * @param moduleBuilder - 当前模块的构建器实例。
   */
  run: (page: IRPage, moduleBuilder: ModuleBuilder) => {
    // [!> 新增：处理页面状态 (States) <!]
    if (page.states) {
      // 确保导入 useState
      moduleBuilder.addImport(
        { package: "reat", destructuring: true },
        "useState"
      );

      for (const [stateName, literal] of Object.entries(page.states)) {
        const defaultValue = JSON.stringify(literal.value);
        // e.g., const [open_123, setOpen_123] = useState(false);
        const stateHook = `const [${stateName}, set_${stateName}] = useState(${defaultValue});`;
        moduleBuilder.addState(stateHook);
      }
    }

    // [!> 新增：处理页面方法 (Methods) <!]
    if (page.methods) {
      for (const [methodName, jsFunction] of Object.entries(page.methods)) {
        let funcBody = jsFunction.value;

        // [!> 转换 this.setState <!]
        // (这是一个简易版实现，只支持 this.setState({ xxx: yyy }))
        funcBody = funcBody.replace(
          /this\.setState\(\s*\{([^}]+)\}\s*\)/g,
          (stateChanges) => {
            // stateChanges 是 " open_123: true "
            const [stateName, stateValue] = stateChanges.split(":");
            // e.g., set_open_123(true)
            return `set_${stateName.trim()}(${stateValue.trim()});`;
          }
        );

        // 移除 function() { ... }
        funcBody = funcBody
          .replace(/^function\s*\(\)\s*\{/, "")
          .replace(/\s*\}$/, "");

        // e.g., const open_123 = () => { set_open_123(true); };
        const methodConst = `const ${methodName} = () => {\n  ${funcBody}\n};`;
        moduleBuilder.addMethod(methodConst);
      }
    }

    // [!> 逻辑修改：现在只处理 page.node <!]
    const irNode = page.node;
    if (irNode.componentName === "Page" && irNode.children) {
      const childrenJsxStrings = irNode.children
        .map((childNode) => generateJSX(childNode, moduleBuilder, 0, page)) // [!> 传递 page <!]
        .join("\n");
      moduleBuilder.setJSX(
        `<>
${childrenJsxStrings}
</>`
      );
    } else {
      const jsxString = generateJSX(irNode, moduleBuilder, 0, page); // [!> 传递 page <!]
      moduleBuilder.setJSX(jsxString);
    }
  },
};

export default jsxPlugin;

/**
 *新增辅助函数
 * 转换 this.state.xxx 和 this.methods.xxx
 */
function transformExpression(value: string): string {
  if (value.startsWith("this.state.")) {
    return value.substring("this.state.".length);
  }
  if (value.startsWith("this.methods.")) {
    return value.substring("this.methods.".length);
  }
  return value;
}

// --- 辅助函数：生成单个 Action 的调用代码 ---
// (我们将复用这个函数)
function generateSingleActionMethod(
  action: IRAction,
  moduleBuilder: ModuleBuilder
): { handlerName: string; methodBody: string } {
  const handlerName = `handle${upperFirst(
    camelCase(action.actionType || "action")
  )}${action.config.componentId || uniqueId("Action")}`;

  // 步骤 2：调用新函数
  const actionCall = generateActionCallString(action, moduleBuilder);

  const methodBody = `
  /**
   * 动作: ${action.actionType}
   * Config: ${JSON.stringify(action.config)}
   */
  const ${handlerName} = () => {
    ${actionCall}
  };`;

  return { handlerName, methodBody };
}

/**
 * 生成包含多个 Action 调用的方法
 * @param actions
 * @param moduleBuilder
 * @returns
 */
function generateMultiActionMethod(
  actions: IRAction[],
  moduleBuilder: ModuleBuilder
): { handlerName: string; methodBody: string } {
  // 步骤 3：实现多事件处理
  const handlerName = `handleOnClick${uniqueId("Actions")}`;

  // 循环生成所有 action 调用
  const actionCalls = actions
    .map((action) => {
      // 复用 generateActionCallString
      const callString = generateActionCallString(action, moduleBuilder);
      // 添加注释
      return `
    // Action: ${action.actionType}
    ${callString}`;
    })
    .join("\n");

  const methodBody = `
  /**
   * 处理多个动作
   */
  const ${handlerName} = () => {
    ${actionCalls}
  };`;

  return { handlerName, methodBody };
}

/**
 * 类型守卫：检查是否为 IRAction[]
 */
function isIRActionArray(propValue: any): propValue is IRAction[] {
  return (
    Array.isArray(propValue) &&
    propValue.length > 0 &&
    typeof propValue[0] === "object" &&
    propValue[0] !== null &&
    "type" in propValue[0] &&
    propValue[0].type === "Action"
  );
}
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
  indentLevel: number,
  page: IRPage
): string {
  const indent = "  ".repeat(indentLevel + 2);

  // 1. 获取元数据和动态标签名
  const meta = getComponentCodeGenMeta(irNode.componentName);

  // (使用可选链 ?. 保证了向后兼容性)
  // (这会读取 irNode.props 上的 'url' 或 'icon'，并向 moduleBuilder 添加 hooks/imports)
  meta.getLogicFragments?.(irNode.props, moduleBuilder);

  const tagName = meta.getTagName(irNode.props);

  // 2. 处理组件导入
  moduleBuilder.addImport(irNode.dependency, irNode.componentName);

  const jsxProps = meta.getTransformedProps(irNode.props);

  const {
    children: childrenProp,
    className: classNamePropValue,
    ...restOfProps // <--- 这是已清理过的 props (e.g., 不含 'spin' 或 'type')
  } = jsxProps;

  const cssClassName = irNode.css ? `\${styles.${irNode.css}}` : null;

  // 5. 处理 Props 字符串
  const propsString = generatePropsString(
    restOfProps,
    moduleBuilder,
    indentLevel + 1,
    page
  );

  // 6. 处理 Children
  let childrenString = "";
  if (irNode.children && irNode.children.length > 0) {
    // 6a. 优先处理真实的子节点 (irNode.children)
    childrenString = irNode.children
      .map((child) => generateJSX(child, moduleBuilder, indentLevel + 1, page))
      .join("\n");
  } else if (childrenProp) {
    // 6b. 再处理来自 props 的 children (例如 Button 的 text, Slot)
    if (
      typeof childrenProp === "object" &&
      childrenProp !== null &&
      !Array.isArray(childrenProp)
    ) {
      // 使用 'type' in ... 来区分 IRLiteral 和 IRNode
      if ("type" in childrenProp && childrenProp.type === "Literal") {
        // 6b-1. 子节点是字面量
        const childValueString = generatePropValueString(
          childrenProp,
          moduleBuilder,
          page
        );
        if (childValueString !== undefined) {
          childrenString = `${indent}  {${childValueString}}`;
        }
      } else if ("componentName" in childrenProp) {
        // 6b-2. 子节点是单个 IRNode (JSSlot)
        childrenString = generateJSX(
          childrenProp as IRNode,
          moduleBuilder,
          indentLevel + 1,
          page
        );
      } else {
        // 6b-3. 子节点是 JSExpression, Variable 等
        const childValueString = generatePropValueString(
          childrenProp,
          moduleBuilder,
          page
        );
        if (childValueString !== undefined) {
          childrenString = `${indent}  {${childValueString}}`;
        }
      }
    } else if (
      Array.isArray(childrenProp) &&
      childrenProp.length > 0 &&
      "componentName" in childrenProp[0]
    ) {
      // 6b-4. 子节点是 IRNode 数组 (JSSlot with multiple nodes)
      childrenString = childrenProp
        .map((child) =>
          generateJSX(child as IRNode, moduleBuilder, indentLevel + 1, page)
        )
        .join("\n");
    }
  }

  // 7. 处理 className (合并来自 props 的 className 和来自 styles 的 css)
  const classList: string[] = [];

  // 7a. 处理来自 props 的 className
  if (classNamePropValue) {
    if (
      typeof classNamePropValue === "object" &&
      classNamePropValue !== null &&
      !Array.isArray(classNamePropValue)
    ) {
      // 必须先检查 'type' 属性是否存在, 才能安全地访问它
      // 这会帮助 TypeScript 排除 IRNode 类型
      if ("type" in classNamePropValue) {
        if (classNamePropValue.type === "Literal") {
          // 在这里, classNamePropValue 被收窄为 IRLiteral, 访问 .value 是安全的
          classList.push(String(classNamePropValue.value)); // 纯字符串
        } else {
          // 它是 JSExpression, Variable, JSFunction, IRAction 等
          const classNameValue = generatePropValueString(
            classNamePropValue,
            moduleBuilder,
            page
          );
          if (classNameValue !== undefined) {
            classList.push(`\${${classNameValue}}`); // 动态变量
          }
        }
      } else {
        // 它没有 'type' 属性, 可能是 IRNode, 这是无效的 className
        console.warn(
          "[CodeGenerator] className prop cannot be an IRNode.",
          classNamePropValue
        );
      }
    } else if (Array.isArray(classNamePropValue)) {
      // 数组类型的 className 也是无效的
      console.warn(
        "[CodeGenerator] className prop cannot be an array.",
        classNamePropValue
      );
    }
  }

  // 7b. 处理 irNode.css (由 css.ts 插件生成的)
  if (cssClassName) {
    classList.push(cssClassName);
  }

  let classNameProp = "";
  if (classList.length > 0) {
    classNameProp = ` className={\`${classList.join(" ")}\`}`;
  }

  // 8. 组合 JSX 字符串
  if (childrenString) {
    return `${indent}<${tagName}${propsString}${classNameProp}>\n${childrenString}\n${indent}</${tagName}>`;
  } else {
    return `${indent}<${tagName}${propsString}${classNameProp} />`;
  }
}

/**
 * 生成组件的属性字符串 (e.g., `prop1="value1" prop2={value2}`)。
 * @param props - 经过转换后, *不包含* children 和 className 的 props 对象。
 * @param moduleBuilder - ModuleBuilder 实例。
 * @param indentLevel - 当前缩进级别 (用于多行属性格式化)。
 * @returns 格式化后的属性字符串 (包含前导空格)，如果无有效属性则返回空字符串。
 */
function generatePropsString(
  props: Record<string, IRPropValue>,
  moduleBuilder: ModuleBuilder,
  indentLevel: number,
  page: IRPage
): string {
  const propStrings: string[] = [];
  const multiLineIndent = "  ".repeat(indentLevel + 1);

  // 遍历所有 props
  for (const key in props) {
    // children 和 className 已在 generateJSX 中单独处理
    if (key === "children" || key === "className") {
      continue;
    }

    const propValue = props[key];
    const propStringValue = generatePropValueString(
      propValue,
      moduleBuilder,
      page
    );

    if (propStringValue !== undefined) {
      if (
        typeof propValue === "object" &&
        propValue !== null &&
        !Array.isArray(propValue) &&
        "type" in propValue &&
        propValue.type === "Literal" &&
        "value" in propValue &&
        typeof propValue.value === "boolean"
      ) {
        if (propValue.value) {
          propStrings.push(`${key}`); // 对于 true 的布尔属性，只写属性名
        } else {
          propStrings.push(`${key}={${propStringValue}}`); // {false}
        }
      } else {
        // 其他类型属性使用 key={value} 格式
        // propStringValue 已经是带 {} 或 "" 的了
        propStrings.push(`${key}={${propStringValue}}`);
      }
    }
  }

  if (propStrings.length === 0) {
    return "";
  }

  // 格式化
  const singleLineProps = " " + propStrings.join(" ");
  if (singleLineProps.length > 80) {
    return (
      `\n${multiLineIndent}` +
      propStrings.join(`\n${multiLineIndent}`) +
      `\n${"  ".repeat(indentLevel)}`
    );
  } else {
    return singleLineProps;
  }
}

/**
 * 将 IRPropValue 转换为 JSX 属性值所需的字符串。
 * @description (基本与我的版本一致, 稍作清理和增强)
 */
function generatePropValueString(
  propValue: IRPropValue,
  moduleBuilder: ModuleBuilder,
  page: IRPage
): string | undefined {
  // 1. IRAction[]
  if (isIRActionArray(propValue)) {
    const { handlerName, methodBody } = generateMultiActionMethod(
      propValue,
      moduleBuilder
    );
    moduleBuilder.addMethod(methodBody);
    return handlerName;
  }

  // 2. IRNode[] (Slot 数组)
  if (
    Array.isArray(propValue) &&
    propValue.length > 0 &&
    typeof propValue[0] === "object" &&
    propValue[0] !== null &&
    "componentName" in propValue[0]
  ) {
    // 渲染 JSSlot 数组
    return `[
      ${propValue
        .map((node) =>
          // 注意：JSSlot 内部的 JSX 缩进需要单独处理，这里暂定一个基础缩进
          generateJSX(node as IRNode, moduleBuilder, 1, page)
        )
        .join(",\n")}
    ]`;
  }

  if (typeof propValue !== "object" || propValue === null) {
    // 这可能是一个无效的 IRPropValue (比如 schema 里的 null)
    if (propValue === null) return "null";
    console.warn("Invalid IRPropValue: must be an object or array.", propValue);
    return undefined;
  }

  // 3. IRAction (单个)
  if ("type" in propValue && propValue.type === "Action") {
    const { handlerName, methodBody } = generateSingleActionMethod(
      propValue,
      moduleBuilder
    );
    moduleBuilder.addMethod(methodBody);
    return handlerName;
  }

  // 4. (IRLiteral | IRVariable | IRJSExpression | IRJSFunction)
  if ("type" in propValue) {
    switch (propValue.type) {
      case "Literal":
        // 改进对对象的 stringify
        if (
          typeof propValue.value === "object" &&
          propValue.value !== null &&
          !Array.isArray(propValue.value)
        ) {
          try {
            // 尝试安全的 JSON.stringify
            return JSON.stringify(propValue.value);
          } catch (e) {
            console.warn("无法 stringify 对象字面量: ", propValue.value, e);
            return "{}"; // 降级
          }
        }
        // 其他字面量 (string, number, boolean, null)
        return JSON.stringify(propValue.value);

      case "JSExpression":
        return transformExpression(propValue.value);
      case "JSFunction":
        return transformExpression(propValue.value);
      case "Variable":
        return propValue.name;

      default:
        console.warn(
          `Unrecognized IRPropValue type: ${
            (propValue as any).type
          }. Skipping prop.`
        );
        return undefined;
    }
  }

  // 5. IRNode (单个 Slot)
  if ("componentName" in propValue) {
    // 支持 JSSlot
    // 返回被括号包裹的 JSX 字符串
    return `(${generateJSX(propValue as IRNode, moduleBuilder, 0, page)})`;
  }

  // --- 默认 Fallback ---
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
// function generateStyleString(
//   styles?: Record<string, string>
// ): string | undefined {
//   // 如果 styles 不存在或为空对象，则返回 undefined
//   if (!styles || isEmpty(styles)) {
//     return undefined;
//   }
//   const styleObject: Record<string, string> = {};
//   // 遍历原始样式对象
//   for (const key in styles) {
//     if (Object.prototype.hasOwnProperty.call(styles, key)) {
//       // 将 CSS 属性名转换为驼峰式 (e.g., background-color -> backgroundColor)
//       styleObject[camelCase(key)] = styles[key];
//     }
//   }
//   // 将处理后的样式对象转换为 JSON 字符串
//   return JSON.stringify(styleObject);
// }
