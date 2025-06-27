import { Tree } from "antd";
import {
  getComponentById,
  useComponetsStore,
  type Component,
} from "../../../stores/components";
import type { TreeProps } from "antd/es/tree";
import { type Key } from "react";
/**
 * @description 一个递归辅助函数，用于在拖拽操作后，
 * 重新计算并修正所有节点的 parentId。
 * @param nodes - 当前要处理的组件节点数组。
 * @param parentId - 这些节点的父节点 ID。
 */
const updateParentIds = (nodes: Component[], parentId?: number) => {
  nodes.forEach((node) => {
    node.parentId = parentId;
    if (node.children && node.children.length > 0) {
      updateParentIds(node.children, node.id);
    }
  });
};
// 容器组件列表，用于判断是否drop组件为容器组件
const ContainerList: Set<string> = new Set([
  "Container",
  "Page",
  "Modal",
  "Table",
]);

export function Outline() {
  const { components, setCurComponentId, setComponents } = useComponetsStore();

  /**
   * @description 拖拽结束时的核心处理器。
   * 此函数负责计算拖拽后的新树结构，并调用 store action 更新全局状态。
   */
  const onDrop: TreeProps["onDrop"] = (info) => {
    const { dragNode, node, dropToGap } = info;
    if (node.key === 1) return;
    const dropKey = node.key;
    const dragKey = dragNode.key;
    // node.pos 是一个类似 '0-1-0' 的字符串，表示节点在树中的路径
    const dropPos = node.pos.split("-");
    // dropPosition 是 antd 计算出的原始放置位置，需要进行转换
    // 运行结果为1表示需要向后插入，为-1表示需要向前插入
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    // 使用深拷贝来操作，避免直接修改原始 state
    const data = structuredClone(components);

    // 1. 找到并移除被拖拽的节点
    let dragObj: Component;

    // 递归查找函数
    const loop = (
      data: Component[],
      key: Key,
      callback: (node: Component, i: number, data: Component[]) => void
    ) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].id === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children!, key, callback);
        }
      }
    };

    loop(data, dragKey, (item, index, arr) => {
      if (!ContainerList.has(getComponentById(Number(dropKey), data)!.name))
        return;
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!dragObj!) {
      return;
    }

    // 2. 将被拖拽的节点插入到新的位置
    if (!dropToGap) {
      // --- Case 1: 拖拽到某个节点上 (Drop on a node) ---
      // 使其成为该节点的子节点
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        // 插入到子列表的最前面
        item.children.unshift(dragObj);
      });
    } else {
      // --- Case 2: 拖拽到两个节点之间的间隙 (Drop in a gap) ---
      let ar: Component[] = [];
      let i: number;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        // 插入到目标节点的前面
        ar.splice(i!, 0, dragObj);
      } else {
        // 插入到目标节点的后面
        ar.splice(i! + 1, 0, dragObj);
      }
    }

    // 3. 全量更新所有节点的 parentId
    updateParentIds(data);

    // 4. 调用 store action，用新的树结构替换旧的
    setComponents(data);
  };

  return (
    <Tree
      fieldNames={{ title: "desc", key: "id" }}
      treeData={components as any} // 直接使用 store 中的数据
      showLine={{
        showLeafIcon: false,
      }}
      defaultExpandAll
      defaultExpandParent
      draggable={{ icon: false }} // 开启拖拽，并隐藏默认的拖拽图标
      onDrop={onDrop}
      onSelect={([selectedKey]) => {
        setCurComponentId(selectedKey as number);
      }}
    />
  );
}
