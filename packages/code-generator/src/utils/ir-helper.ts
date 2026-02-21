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
 * 深度遍历 IRNode 树并构建 ID -> IRNode 的索引映射。
 * @param irNode - 当前遍历的根 IRNode
 * @param map - 用于累积结果的 Map，key 通常为节点 id
 */
export const buildIrNodeMap = (
  irNode: IRNode,
  map: Map<number | string, IRNode>,
) => {
  map.set(irNode.id, irNode);

  // 递归子节点
  if (irNode.children) {
    for (const child of irNode.children) {
      buildIrNodeMap(child, map);
    }
  }

  // 递归 Prop 中的 JSSlot (单个或数组)
  for (const prop of Object.values(irNode.props)) {
    if (prop && typeof prop === "object") {
      if ((prop as IRNode).componentName) {
        // JSSlot (单个)
        buildIrNodeMap(prop as IRNode, map);
      } else if (
        Array.isArray(prop) &&
        prop[0] &&
        (prop[0] as IRNode).componentName
      ) {
        // JSSlot (数组)
        for (const node of prop as IRNode[]) {
          buildIrNodeMap(node, map);
        }
      }
    }
  }
};
