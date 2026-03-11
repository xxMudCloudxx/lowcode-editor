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

/**
 * 深度遍历 IRNode 树并构建 ID -> IRNode 的索引映射（显式栈迭代）。
 * @param irNode - 当前遍历的根 IRNode
 * @param map - 用于累积结果的 Map，key 通常为节点 id
 */
export const buildIrNodeMap = (
  irNode: IRNode,
  map: Map<number | string, IRNode>,
) => {
  const stack: IRNode[] = [irNode];

  while (stack.length > 0) {
    const current = stack.pop()!;
    map.set(current.id, current);

    // 子节点入栈（逆序以保持遍历顺序）
    if (current.children) {
      for (let i = current.children.length - 1; i >= 0; i--) {
        stack.push(current.children[i]);
      }
    }

    // Prop 中的 JSSlot 入栈
    for (const prop of Object.values(current.props)) {
      if (prop && typeof prop === "object") {
        if ((prop as IRNode).componentName) {
          stack.push(prop as IRNode);
        } else if (
          Array.isArray(prop) &&
          prop[0] &&
          (prop[0] as IRNode).componentName
        ) {
          for (let i = (prop as IRNode[]).length - 1; i >= 0; i--) {
            stack.push((prop as IRNode[])[i]);
          }
        }
      }
    }
  }
};
