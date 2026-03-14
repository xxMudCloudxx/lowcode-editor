/**
 * @file Vue Template 生成插件
 * @description 负责将 IRNode 转换为 Vue <template> 代码字符串。
 *              对应 React 方案的 jsx.ts，但生成 Vue 模板语法。
 *
 * 差异对照（React JSX vs Vue Template）:
 *   - className → class
 *   - onClick={handler} → @click="handler"
 *   - style={{...}} → :style="{...}"
 *   - {expression} → {{ expression }}
 *   - <Component /> → <Component />（相同）
 */

import type {
  IRAction,
  IRNode,
  IRPage,
  IRPropValue,
  IModuleBuilder,
  IComponentPlugin,
} from "@lowcode/schema";
import { camelCase, upperFirst, uniqueId } from "lodash-es";
import { createActionHandlerRegistry } from "../shared/handlers/actions";
import type { CodeGenRegistry } from "../../../registry/codegen-registry";
import type { VueModuleBuilder } from "../../../utils/vue-module-builder";
import type { IActionHandlerContext } from "../shared/handlers/actions";
import { buildActionHandlerContext } from "../shared/action-handler-context";

const getVueActionHandler = createActionHandlerRegistry("ant-design-vue");

// ============================================================
// Action 辅助函数
// ============================================================

function generateActionCallString(
  action: IRAction,
  moduleBuilder: VueModuleBuilder,
  actionContext?: IActionHandlerContext,
): string {
  const handler = getVueActionHandler(action.actionType);
  return handler(action, moduleBuilder, actionContext);
}

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

function generateSingleActionMethod(
  action: IRAction,
  moduleBuilder: VueModuleBuilder,
  actionContext?: IActionHandlerContext,
): { handlerName: string; methodBody: string } {
  const handlerName = `handle${upperFirst(
    camelCase(action.actionType || "action"),
  )}${action.config.componentId || uniqueId("Action")}`;

  const actionCall = generateActionCallString(
    action,
    moduleBuilder,
    actionContext,
  );

  const methodBody = `const ${handlerName} = (...args: any[]) => {
  ${actionCall}
};`;

  return { handlerName, methodBody };
}

function generateMultiActionMethod(
  actions: IRAction[],
  moduleBuilder: VueModuleBuilder,
  actionContext?: IActionHandlerContext,
): { handlerName: string; methodBody: string } {
  const handlerName = `handleOnClick${uniqueId("Actions")}`;

  const actionCalls = actions
    .map((action) => {
      const callString = generateActionCallString(
        action,
        moduleBuilder,
        actionContext,
      );
      return `  // Action: ${action.actionType}\n  ${callString}`;
    })
    .join("\n");

  const methodBody = `const ${handlerName} = (...args: any[]) => {
${actionCalls}
};`;

  return { handlerName, methodBody };
}

// ============================================================
// 表达式转换
// ============================================================

function transformExpression(value: string): string {
  return value;
}

// ============================================================
// Vue 组件名映射（antd → ant-design-vue）
// ============================================================

/**
 * 某些 antd 组件在 ant-design-vue 中使用不同的名称或写法。
 * 这里做基础映射；大部分 antd 组件在 ant-design-vue 中同名可用。
 */
function resolveVueTagName(tagName: string): string {
  // ant-design-vue 的子组件使用短横线并加前缀 a- 也可以，
  // 但由于 <script setup> 自动注册，我们直接使用 PascalCase 保持一致。
  return tagName;
}

// ============================================================
// 核心：Vue Template 生成
// ============================================================

/**
 * 递归生成 Vue <template> 字符串。
 */
function generateVueTemplate(
  irNode: IRNode,
  moduleBuilder: VueModuleBuilder,
  indentLevel: number,
  page: IRPage,
  registry: CodeGenRegistry,
): string {
  const indent = "  ".repeat(indentLevel + 1);

  // 1. 获取元数据
  const meta = registry.resolve(irNode.componentName);
  meta.getLogicFragments?.(irNode.props, moduleBuilder as any);
  const tagName = resolveVueTagName(meta.getTagName(irNode.props));

  // 2. 处理组件导入
  moduleBuilder.addImport(irNode.dependency, irNode.componentName);

  // 3. 转换 Props
  const jsxProps = meta.getTransformedProps(irNode.props);
  const {
    children: childrenProp,
    className: classNamePropValue,
    ...restOfProps
  } = jsxProps;
  const actionContext = buildActionHandlerContext(irNode, {
    serializeStateRef: (stateName) => `${stateName}.value`,
  });

  // 4. 处理 CSS 类名
  const cssClassName = irNode.css ? irNode.css : null;

  // 5. 构建属性字符串
  const attrsString = generateVueAttrsString(
    restOfProps,
    moduleBuilder,
    indentLevel + 1,
    page,
    actionContext,
  );

  // 6. 处理 class 属性
  const classList: string[] = [];
  if (classNamePropValue) {
    if (
      typeof classNamePropValue === "object" &&
      classNamePropValue !== null &&
      !Array.isArray(classNamePropValue) &&
      "type" in classNamePropValue
    ) {
      if (classNamePropValue.type === "Literal") {
        classList.push(String(classNamePropValue.value));
      }
    }
  }
  if (cssClassName) {
    classList.push(cssClassName);
  }

  let classProp = "";
  if (classList.length > 0) {
    classProp = ` class="${classList.join(" ")}"`;
  }

  // 7. 处理 Children
  let childrenString = "";
  if (irNode.children && irNode.children.length > 0) {
    childrenString = irNode.children
      .map((child) =>
        generateVueTemplate(
          child,
          moduleBuilder,
          indentLevel + 1,
          page,
          registry,
        ),
      )
      .join("\n");
  } else if (childrenProp) {
    childrenString = generateVueChildrenString(
      childrenProp,
      moduleBuilder,
      indentLevel,
      page,
      indent,
      registry,
    );
  }

  // 8. 组合
  if (childrenString) {
    return `${indent}<${tagName}${attrsString}${classProp}>\n${childrenString}\n${indent}</${tagName}>`;
  } else {
    return `${indent}<${tagName}${attrsString}${classProp} />`;
  }
}

/**
 * 生成 children 内容字符串
 */
function generateVueChildrenString(
  childrenProp: IRPropValue,
  moduleBuilder: VueModuleBuilder,
  indentLevel: number,
  page: IRPage,
  indent: string,
  registry: CodeGenRegistry,
): string {
  if (
    typeof childrenProp === "object" &&
    childrenProp !== null &&
    !Array.isArray(childrenProp)
  ) {
    if ("type" in childrenProp && childrenProp.type === "Literal") {
      const val = childrenProp.value;
      return typeof val === "string"
        ? `${indent}  ${val}`
        : `${indent}  {{ ${JSON.stringify(val)} }}`;
    } else if ("componentName" in childrenProp) {
      return generateVueTemplate(
        childrenProp as IRNode,
        moduleBuilder,
        indentLevel + 1,
        page,
        registry,
      );
    } else if ("type" in childrenProp) {
      const val = generatePropValueForTemplate(childrenProp);
      return val !== undefined ? `${indent}  {{ ${val} }}` : "";
    }
  } else if (
    Array.isArray(childrenProp) &&
    childrenProp.length > 0 &&
    typeof childrenProp[0] === "object" &&
    childrenProp[0] !== null &&
    "componentName" in childrenProp[0]
  ) {
    return childrenProp
      .map((child) =>
        generateVueTemplate(
          child as IRNode,
          moduleBuilder,
          indentLevel + 1,
          page,
          registry,
        ),
      )
      .join("\n");
  }
  return "";
}

/**
 * 生成 Vue 模板属性字符串。
 * @description Vue 模板中事件使用 @event，动态绑定使用 :prop，
 *              字面量字符串使用 prop="value"，布尔值使用 prop / :prop="false"。
 */
function generateVueAttrsString(
  props: Record<string, IRPropValue>,
  moduleBuilder: VueModuleBuilder,
  indentLevel: number,
  page: IRPage,
  actionContext?: IActionHandlerContext,
): string {
  const attrStrings: string[] = [];

  for (const key in props) {
    if (key === "children" || key === "className") continue;

    const propValue = props[key];

    // 处理事件 (IRAction / IRAction[])
    if (isIRActionArray(propValue)) {
      const { handlerName, methodBody } = generateMultiActionMethod(
        propValue,
        moduleBuilder,
        actionContext,
      );
      moduleBuilder.addMethod(methodBody);
      // 将 onClick → @click，onMouseEnter → @mouseenter 等
      const eventName = convertEventName(key);
      attrStrings.push(`@${eventName}="${handlerName}"`);
      continue;
    }

    if (
      typeof propValue === "object" &&
      propValue !== null &&
      !Array.isArray(propValue) &&
      "type" in propValue &&
      propValue.type === "Action"
    ) {
      const { handlerName, methodBody } = generateSingleActionMethod(
        propValue as IRAction,
        moduleBuilder,
        actionContext,
      );
      moduleBuilder.addMethod(methodBody);
      const eventName = convertEventName(key);
      attrStrings.push(`@${eventName}="${handlerName}"`);
      continue;
    }

    // 处理普通属性
    const attrStr = generateSingleAttr(key, propValue, moduleBuilder, page);
    if (attrStr) attrStrings.push(attrStr);
  }

  if (attrStrings.length === 0) return "";

  const singleLine = " " + attrStrings.join(" ");
  if (singleLine.length > 80) {
    const multiIndent = "  ".repeat(indentLevel + 1);
    return (
      `\n${multiIndent}` +
      attrStrings.join(`\n${multiIndent}`) +
      `\n${"  ".repeat(indentLevel)}`
    );
  }
  return singleLine;
}

/**
 * 生成单个属性字符串
 */
function generateSingleAttr(
  key: string,
  propValue: IRPropValue,
  _moduleBuilder: VueModuleBuilder,
  _page: IRPage,
): string | null {
  if (typeof propValue !== "object" || propValue === null) {
    if (propValue === null) return `:${key}="null"`;
    return null;
  }

  if (!("type" in propValue)) {
    // IRNode (slot)
    if ("componentName" in propValue) {
      // Vue 中可通过 #slot 实现，暂简化处理
      return null;
    }
    return null;
  }

  switch (propValue.type) {
    case "Literal": {
      const val = propValue.value;
      if (typeof val === "string") return `${key}="${val}"`;
      if (typeof val === "boolean") return val ? key : `:${key}="false"`;
      if (typeof val === "number") return `:${key}="${val}"`;
      // 对象 / 数组
      try {
        return `:${key}="${JSON.stringify(val).replace(/"/g, "'")}"`;
      } catch {
        return `:${key}="{}"`;
      }
    }
    case "JSExpression":
      return `:${key}="${transformExpression(propValue.value)}"`;
    case "JSFunction":
      return `:${key}="${transformExpression(propValue.value)}"`;
    case "StateRef":
      return `:${key}="${propValue.stateName}"`;
    case "MethodRef":
      return `:${key}="${propValue.methodName}"`;
    default:
      return null;
  }
}

/**
 * 将 React 事件名转换为 Vue 事件名。
 * @example onClick → click, onChange → change, onMouseEnter → mouseenter
 */
function convertEventName(reactEventName: string): string {
  if (reactEventName.startsWith("on")) {
    // onClick → click, onMouseEnter → mouse-enter (Vue 事件名用小写)
    const name = reactEventName.slice(2);
    return name.charAt(0).toLowerCase() + name.slice(1);
  }
  return reactEventName;
}

/**
 * 将 IRPropValue 转换为 Vue 模板表达式字符串（用于 {{ }} 插值）。
 */
function generatePropValueForTemplate(
  propValue: IRPropValue,
): string | undefined {
  if (isIRActionArray(propValue)) return undefined;

  if (typeof propValue !== "object" || propValue === null) {
    if (propValue === null) return "null";
    return undefined;
  }

  if (!("type" in propValue)) return undefined;

  switch (propValue.type) {
    case "Literal":
      return JSON.stringify(propValue.value);
    case "JSExpression":
      return transformExpression(propValue.value);
    case "JSFunction":
      return transformExpression(propValue.value);
    case "StateRef":
      return propValue.stateName;
    case "MethodRef":
      return propValue.methodName;
    default:
      return undefined;
  }
}

// ============================================================
// 插件定义
// ============================================================

const vueTemplatePlugin: IComponentPlugin = {
  type: "component",
  name: "vue-template",

  run: (
    page: IRPage,
    moduleBuilder: IModuleBuilder,
    _projectBuilder: any,
    context?: { registry: CodeGenRegistry },
  ) => {
    const registry = context?.registry;
    if (!registry) {
      throw new Error(
        "[vueTemplatePlugin] 缺少 CodeGenRegistry，请在 context 中传入 registry",
      );
    }

    const builder = moduleBuilder as VueModuleBuilder;

    // 1. 处理页面状态 (States)
    if (page.states) {
      builder.addVueImport("ref");

      for (const [stateName, literal] of Object.entries(page.states)) {
        const defaultValue = JSON.stringify(literal.value);
        builder.addState(`const ${stateName} = ref(${defaultValue});`);
      }
    }

    // 2. 处理页面方法 (Methods)
    if (page.methods) {
      for (const [methodName, stateUpdater] of Object.entries(page.methods)) {
        // IRStateUpdater → Vue: const xxx = () => { stateName.value = value; };
        const { stateName, value } = stateUpdater;
        const methodConst = `const ${methodName} = () => {\n  ${stateName}.value = ${JSON.stringify(value)};\n};`;
        builder.addMethod(methodConst);
      }
    }

    // 3. 生成模板
    const irNode = page.node;
    if (irNode.componentName === "Page" && irNode.children) {
      const childrenTemplateStrings = irNode.children
        .map((childNode) =>
          generateVueTemplate(childNode, builder, 0, page, registry),
        )
        .join("\n");
      builder.setJSX(`  <div>\n${childrenTemplateStrings}\n  </div>`);
    } else {
      const templateString = generateVueTemplate(
        irNode,
        builder,
        0,
        page,
        registry,
      );
      builder.setJSX(templateString);
    }
  },
};

export default vueTemplatePlugin;
