/**
 * @file CSS 样式提取器（框架无关）
 * @description 递归遍历 IRNode 树，提取所有样式并注册到 ModuleBuilder。
 *              React（CSS Modules）和 Vue（Scoped CSS）共享此逻辑。
 */

import type { IRNode, IModuleBuilder } from "@lowcode/schema";
import { isEmpty } from "lodash-es";

/**
 * 遍历 IRNode 树，提取所有样式（显式栈迭代，避免深嵌套栈溢出）
 */
export function traverseAndExtractStyles(
  irNode: IRNode,
  moduleBuilder: IModuleBuilder,
) {
  const stack: IRNode[] = [irNode];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const { styles, id } = current;

    // 1. 检查当前节点是否存在样式
    if (styles && !isEmpty(styles)) {
      // 2. 生成一个基于节点 ID 的唯一类名
      const className = `node_${id}`;

      // 3. 将样式规则注册到 ModuleBuilder
      moduleBuilder.addCssClass(className, styles);

      // 4. 将生成的类名存入 irNode.css 字段，供模板/JSX 插件消费
      current.css = className;

      // 5. 清除 irNode.styles，防止模板/JSX 插件再次处理它
      delete current.styles;
    }

    // 6. 子节点入栈（逆序以保持遍历顺序）
    if (current.children && current.children.length > 0) {
      for (let i = current.children.length - 1; i >= 0; i--) {
        stack.push(current.children[i]);
      }
    }

    // 7. Props 中的 Slot 入栈
    for (const key in current.props) {
      const propValue = current.props[key];

      // 7a. 检查数组 Slot (e.g., TabPane)
      if (Array.isArray(propValue)) {
        if (
          propValue.length > 0 &&
          typeof propValue[0] === "object" &&
          propValue[0] !== null &&
          "componentName" in propValue[0]
        ) {
          for (let i = (propValue as IRNode[]).length - 1; i >= 0; i--) {
            stack.push((propValue as IRNode[])[i]);
          }
        }
      }
      // 7b. 检查单个 Slot (e.g., Card.extra)
      else if (
        typeof propValue === "object" &&
        propValue !== null &&
        "componentName" in propValue &&
        !("type" in propValue) // 排除 IRLiteral, IRAction 等
      ) {
        stack.push(propValue as IRNode);
      }
    }
  }
}
