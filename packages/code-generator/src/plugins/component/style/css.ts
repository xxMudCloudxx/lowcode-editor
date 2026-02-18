// src/code-generator/plugins/component/style/css.ts

/**
 * @file CSS 模块插件
 * @description 提取 irNode.styles 并将其转换为 CSS Modules 类。
 */

import type {
  IRNode,
  IRPage,
  ModuleBuilder,
  IComponentPlugin,
} from "@lowcode/schema";
import { isEmpty } from "lodash-es";

/**
 * 递归遍历 IRNode 树，提取所有样式
 */
function traverseAndExtractStyles(
  irNode: IRNode,
  moduleBuilder: ModuleBuilder,
) {
  const { styles, id } = irNode;

  // 1. 检查当前节点是否存在样式
  if (styles && !isEmpty(styles)) {
    // 2. 生成一个基于节点 ID 的唯一类名
    const className = `node_${id}`;

    // 3. 将样式规则注册到 ModuleBuilder
    moduleBuilder.addCssClass(className, styles);

    // 4. 将生成的类名存入 irNode.css 字段，供 jsxPlugin 消费
    irNode.css = className;

    // 5. 清除 irNode.styles，防止 jsxPlugin 再次处理它
    delete irNode.styles;
  }

  // 6. 递归遍历子节点 ---
  if (irNode.children && irNode.children.length > 0) {
    irNode.children.forEach((child) =>
      traverseAndExtractStyles(child, moduleBuilder),
    );
  }

  // 7. 递归遍历 Props 中的 Slot ---
  // (确保 Slot 内部的组件样式也能被提取)
  for (const key in irNode.props) {
    const propValue = irNode.props[key];

    // 7a. 检查数组 Slot (e.g., TabPane)
    if (Array.isArray(propValue)) {
      if (
        propValue.length > 0 &&
        typeof propValue[0] === "object" &&
        propValue[0] !== null &&
        "componentName" in propValue[0]
      ) {
        (propValue as IRNode[]).forEach((child) =>
          traverseAndExtractStyles(child, moduleBuilder),
        );
      }
    }
    // 7b. 检查单个 Slot (e.g., Card.extra)
    else if (
      typeof propValue === "object" &&
      propValue !== null &&
      "componentName" in propValue &&
      !("type" in propValue) // 排除 IRLiteral, IRAction 等
    ) {
      traverseAndExtractStyles(propValue as IRNode, moduleBuilder);
    }
  }
}

const cssPlugin: IComponentPlugin = {
  type: "component",
  name: "react-css-module",

  /**
   * 执行 CSS 模块生成逻辑。
   * @param page - 当前处理的 IR 页面。
   * @param moduleBuilder - 当前模块的构建器实例。
   */
  run: (page: IRPage, moduleBuilder: ModuleBuilder) => {
    traverseAndExtractStyles(page.node, moduleBuilder);
  },
};

export default cssPlugin;
