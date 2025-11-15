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
  const { components, rootId, setComponents } = useComponentsStore();
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
    const dropKey = node.key;
    const dragKey = dragNode.key;

    // node.pos 是类似 '0-1-0' 的字符串，表示节点在树中的路径
    const dropPos = node.pos.split("-");
    // dropPosition 是 antd 计算出的原始放置位置
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    // 使用深拷贝来操作，避免直接修改原始 state
    const data: ComponentTree[] = structuredClone(treeData);

    // 1. 找到并移除被拖拽的节点
    let dragObj: ComponentTree | undefined;

    const loop = (
      list: ComponentTree[],
      key: Key,
      callback: (node: ComponentTree, i: number, data: ComponentTree[]) => void
    ) => {
      for (let i = 0; i < list.length; i += 1) {
        if (list[i].id === key) {
          return callback(list[i], i, list);
        }
        if (list[i].children) {
          loop(list[i].children!, key, callback);
        }
      }
    };

    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!dragObj) {
      return;
    }

    // 2. 将被拖拽的节点插入到新的位置
    if (!dropToGap) {
      // Case 1: 拖拽到某个节点上（成为该节点的子节点）
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        item.children.unshift(dragObj!);
      });
    } else {
      // Case 2: 拖拽到两个节点之间的间隙（同级前后）
      let ar: ComponentTree[] = [];
      let i = 0;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        // 插入到目标节点的前面
        ar.splice(i, 0, dragObj!);
      } else {
        // 插入到目标节点的后面
        ar.splice(i + 1, 0, dragObj!);
      }
    }

    // 3. 全量更新所有节点的 parentId
    updateParentIds(data);

    // 4. 调用 store action，用新的树结构替换旧的
    setComponents(data);
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
    <div className="w-[100%] custom-scrollbar overflow-y-auto absolute overscroll-y-contain pr-6 h-[100%] pb-20">
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

