import { Tree } from "antd";
import type { TreeProps } from "antd/es/tree";
import { type Key, useMemo } from "react";
import {
  useComponentsStore,
  buildComponentTree,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import type { ComponentTree } from "../../../interface";

/**
 * 递归辅助函数：在拖拽操作后，重新计算并修正所有节点的 parentId。
 */
const updateParentIds = (nodes: ComponentTree[], parentId?: number) => {
  nodes.forEach((node) => {
    node.parentId = parentId;
    if (node.children && node.children.length > 0) {
      updateParentIds(node.children, node.id as number);
    }
  });
};

// 容器组件列表，用于判断是否允许将组件拖拽为其子节点
const ContainerList: Set<string> = new Set([
  "Container",
  "Page",
  "Modal",
  "Table",
]);

/**
 * 大纲树组件，展示当前组件树结构，并支持通过拖拽调整层级。
 */
export function Outline() {
  const { components, rootId, moveComponentInOutline } = useComponentsStore();
  const { setCurComponentId } = useUIStore();

  const treeData = useMemo(
    () => buildComponentTree(components, rootId),
    [components, rootId]
  );

  /**
   * 拖拽结束时的核心处理器。
   * 负责计算拖拽后的新树结构，并调用 store action 更新全局状态。
   */
  const onDrop: TreeProps["onDrop"] = (info) => {
    const { dragNode, node, dropToGap } = info;
    const dropKey = node.key as number;
    const dragKey = dragNode.key as number;

    // node.pos 是类似 '0-1-0' 的字符串，表示节点在树中的路径
    const dropPos = node.pos.split("-");
    // dropPosition 是 antd 计算出的原始放置位置
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    moveComponentInOutline(dragKey, dropKey, dropToGap, dropPosition);
  };

  const allowDrop: TreeProps["allowDrop"] = ({ dropNode, dropPosition }) => {
    if (!dropNode) return false;
    const dropNode2 = dropNode as any;
    // 如果 dropPosition 为 0，意味着想要拖入节点内部
    if (Number(dropNode2.id) === 1) return false;
    if (dropPosition === 0) {
      // 检查这个目标节点是不是我们定义的容器类型
      if (ContainerList.has(dropNode2.name)) {
        return true; // 是容器，允许放入
      }
      return false; // 不是容器，禁止放入
    }

    // 对于非内部的拖拽（即放在同级前面或后面），总是允许
    return true;
  };

  return (
    <div className="w-full custom-scrollbar overflow-y-auto absolute overscroll-y-contain pr-6 h-[100%] pb-20">
      <Tree
        fieldNames={{ title: "desc", key: "id" }}
        treeData={treeData as any}
        showLine={{
          showLeafIcon: false,
        }}
        defaultExpandAll
        defaultExpandParent
        allowDrop={allowDrop}
        draggable={{ icon: false }} // 开启拖拽，并隐藏默认的拖拽图标
        onDrop={onDrop}
        onSelect={([selectedKey]) => {
          if (selectedKey != null) {
            setCurComponentId(selectedKey as number);
          }
        }}
      />
    </div>
  );
}
