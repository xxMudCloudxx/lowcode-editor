/**
 * @file Vue CSS 插件
 * @description 提取 irNode.styles 并注册到 VueModuleBuilder 中，
 *              最终生成 <style scoped> 区块。
 *              逻辑与 React 的 css.ts 完全一致，仅适配 Vue 的 IModuleBuilder。
 */

import type {
  IRNode,
  IRPage,
  IModuleBuilder,
  IComponentPlugin,
} from "@lowcode/schema";
import { isEmpty } from "lodash-es";

/**
 * 递归遍历 IRNode 树，提取所有样式。
 */
function traverseAndExtractStyles(
  irNode: IRNode,
  moduleBuilder: IModuleBuilder,
) {
  const { styles, id } = irNode;

  if (styles && !isEmpty(styles)) {
    const className = `node_${id}`;
    moduleBuilder.addCssClass(className, styles);
    irNode.css = className;
    delete irNode.styles;
  }

  if (irNode.children && irNode.children.length > 0) {
    irNode.children.forEach((child) =>
      traverseAndExtractStyles(child, moduleBuilder),
    );
  }

  // 递归遍历 Props 中的 Slot
  for (const key in irNode.props) {
    const propValue = irNode.props[key];

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
    } else if (
      typeof propValue === "object" &&
      propValue !== null &&
      "componentName" in propValue &&
      !("type" in propValue)
    ) {
      traverseAndExtractStyles(propValue as IRNode, moduleBuilder);
    }
  }
}

const vueCssPlugin: IComponentPlugin = {
  type: "component",
  name: "vue-scoped-css",

  run: (page: IRPage, moduleBuilder: IModuleBuilder) => {
    traverseAndExtractStyles(page.node, moduleBuilder);
  },
};

export default vueCssPlugin;
