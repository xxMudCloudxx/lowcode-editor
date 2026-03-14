import type { Component, ComponentTree } from "@lowcode/schema";

/**
 * 从范式化 Map 中构建树状结构。
 *
 * @param components 范式化组件表。
 * @param rootId 根节点 ID。
 * @returns 树状组件结构。
 */
export function buildComponentTree(
  components: Record<number, Component>,
  rootId: number,
): ComponentTree[] {
  if (!components[rootId]) return [];

  const order: number[] = [];
  const dfsStack: number[] = [rootId];

  while (dfsStack.length > 0) {
    const id = dfsStack.pop()!;
    const node = components[id];
    if (!node) continue;
    order.push(id);
    if (node.children && node.children.length > 0) {
      for (let index = node.children.length - 1; index >= 0; index--) {
        dfsStack.push(node.children[index]);
      }
    }
  }

  const treeNodeMap = new Map<number, ComponentTree>();

  for (let index = order.length - 1; index >= 0; index--) {
    const id = order[index];
    const node = components[id];
    if (!node) continue;

    const children =
      node.children && node.children.length > 0
        ? (node.children
            .map((childId) => treeNodeMap.get(childId))
            .filter(Boolean) as ComponentTree[])
        : undefined;

    treeNodeMap.set(id, {
      id: node.id,
      name: node.name,
      props: node.props,
      desc: node.desc,
      parentId: node.parentId,
      children,
      styles: node.styles,
    });
  }

  const rootTree = treeNodeMap.get(rootId);
  return rootTree ? [rootTree] : [];
}

