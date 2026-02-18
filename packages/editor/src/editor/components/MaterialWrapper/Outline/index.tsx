import { Tree } from "antd";
import type { TreeProps } from "antd/es/tree";
import { useMemo } from "react";
import {
  useComponentsStore,
  buildComponentTree,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import { useComponentConfigStore } from "../../../stores/component-config";

/**
 * 大纲树组件，展示当前组件树结构，并支持通过拖拽调整层级。
 */
export function Outline() {
  const { components, rootId, moveComponentInOutline } = useComponentsStore();
  const { setCurComponentId } = useUIStore();
  const { componentConfig } = useComponentConfigStore();

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

  const allowDrop: TreeProps["allowDrop"] = ({
    dragNode,
    dropNode,
    dropPosition,
  }) => {
    if (!dropNode) return false;
    // 只能这样子处理，因为我要的是id，但是TreeDataType是key
    const dropNode2 = dropNode as any;
    const dragNode2 = dragNode as any;
    const dropComponent = components[dropNode2.id as number];
    const dragComponent = components[dragNode2.id as number];
    if (!dropComponent || !dragComponent) return false;

    const dragParentTypes =
      componentConfig[dragComponent.name].editor.parentTypes;
    if (!dragParentTypes) return false;

    // 如果 dropPosition 为 0，意味着想要拖入节点内部
    if (dragComponent.id === rootId) return false;
    if (dropPosition === 0) {
      // 检查这个目标节点是不是我们定义的容器类型
      if (dragParentTypes.includes(dropComponent.name)) {
        return true; // 是容器，允许放入
      }
      return false; // 不是容器，禁止放入
    }

    // 对于非内部的拖拽（即放在同级前面或后面），总是允许
    return true;
  };

  return (
    <div className="w-full custom-scrollbar overflow-y-auto absolute overscroll-y-contain pr-6 h-full pb-20">
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
