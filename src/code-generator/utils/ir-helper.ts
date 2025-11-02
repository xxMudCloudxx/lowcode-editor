import type { IRAction, IRNode } from "../types/ir";

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

export const buildIrNodeMap = (
  irNode: IRNode,
  map: Map<number | string, IRNode>
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
