/**
 * @file IR 工具函数
 * @description 提供遍历 IRNode 树和判定 IRAction 数组的工具方法，供预处理器和各类插件复用。
 */

import type { IRAction, IRNode } from "@lowcode/schema";

/**
 * 判断一个值是否为 IRAction 数组。
 * @param propValue - 任意待检查的属性值
 * @returns `true` 表示这是一个非空的 IRAction 数组
 */
export const isIRActionArray = (propValue: any): propValue is IRAction[] => {
  return (
    Array.isArray(propValue) &&
    propValue.length > 0 &&
    typeof propValue[0] === "object" &&
    propValue[0] !== null &&
    "type" in propValue[0] &&
    propValue[0].type === "Action"
  );
};

const isIRNodeProp = (propValue: unknown): propValue is IRNode => {
  return (
    typeof propValue === "object" &&
    propValue !== null &&
    "componentName" in propValue
  );
};

const isIRNodeArrayProp = (propValue: unknown): propValue is IRNode[] => {
  return (
    Array.isArray(propValue) &&
    propValue.length > 0 &&
    isIRNodeProp(propValue[0])
  );
};

/**
 * 深度遍历 IRNode 树，覆盖 children 和 props 中承载的 slot 节点。
 * @param irNode - 当前遍历的根 IRNode
 * @param visit - 每访问一个节点时执行的回调
 */
export const walkIrNodes = (
  irNode: IRNode,
  visit: (node: IRNode) => void,
) => {
  const stack: IRNode[] = [irNode];

  while (stack.length > 0) {
    const current = stack.pop()!;
    visit(current);

    const propValues = Object.values(current.props);
    for (let i = propValues.length - 1; i >= 0; i--) {
      const prop = propValues[i];

      if (isIRNodeProp(prop)) {
        stack.push(prop);
        continue;
      }

      if (isIRNodeArrayProp(prop)) {
        for (let j = prop.length - 1; j >= 0; j--) {
          stack.push(prop[j]);
        }
      }
    }

    if (current.children) {
      for (let i = current.children.length - 1; i >= 0; i--) {
        stack.push(current.children[i]);
      }
    }
  }
};

/**
 * 深度遍历 IRNode 树并构建 ID -> IRNode 的索引映射（显式栈迭代）。
 * @param irNode - 当前遍历的根 IRNode
 * @param map - 用于累积结果的 Map，key 通常为节点 id
 */
export const buildIrNodeMap = (
  irNode: IRNode,
  map: Map<number | string, IRNode>,
) => {
  walkIrNodes(irNode, (current) => {
    map.set(current.id, current);
  });
};
