import { Tree } from "antd";
import type { TreeProps } from "antd/es/tree";
import { useEffect, useMemo, useRef, useState, type Key } from "react";
import {
  useComponentsStore,
  buildComponentTree,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import { useComponentConfigStore } from "../../../stores/component-config";

const OUTLINE_TREE_MIN_HEIGHT = 240;
const OUTLINE_TREE_BOTTOM_OFFSET = 80;

function areExpandedKeysEqual(
  prevExpandedKeys: Key[],
  nextExpandedKeys: Key[],
) {
  if (prevExpandedKeys.length !== nextExpandedKeys.length) {
    return false;
  }

  return prevExpandedKeys.every((key, index) => key === nextExpandedKeys[index]);
}

/**
 * 大纲树组件，展示当前组件树结构，并支持通过拖拽调整层级。
 */
export function Outline() {
  const components = useComponentsStore((state) => state.components);
  const rootId = useComponentsStore((state) => state.rootId);
  const moveComponentInOutline = useComponentsStore(
    (state) => state.moveComponentInOutline,
  );
  const setCurComponentId = useUIStore((state) => state.setCurComponentId);
  const componentConfig = useComponentConfigStore((state) => state.componentConfig);
  const treeViewportRef = useRef<HTMLDivElement>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([rootId]);
  const [treeHeight, setTreeHeight] = useState(OUTLINE_TREE_MIN_HEIGHT);

  const treeData = useMemo(
    () => buildComponentTree(components, rootId),
    [components, rootId],
  );

  useEffect(() => {
    setExpandedKeys((prevExpandedKeys) => {
      const nextExpandedKeys = prevExpandedKeys.filter(
        (key) => components[Number(key)] != null,
      );

      if (components[rootId] && !nextExpandedKeys.includes(rootId)) {
        nextExpandedKeys.unshift(rootId);
      }

      return areExpandedKeysEqual(prevExpandedKeys, nextExpandedKeys)
        ? prevExpandedKeys
        : nextExpandedKeys;
    });
  }, [components, rootId]);

  useEffect(() => {
    const viewport = treeViewportRef.current;
    if (!viewport) return;

    const updateTreeHeight = (nextHeight: number) => {
      const normalizedHeight = Math.max(
        OUTLINE_TREE_MIN_HEIGHT,
        Math.floor(nextHeight),
      );

      setTreeHeight((prevHeight) =>
        prevHeight === normalizedHeight ? prevHeight : normalizedHeight,
      );
    };

    updateTreeHeight(viewport.getBoundingClientRect().height);

    const resizeObserver = new ResizeObserver(([entry]) => {
      updateTreeHeight(entry.contentRect.height);
    });

    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, []);

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
      componentConfig[dragComponent.name]?.editor.parentTypes;
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
    <div className="absolute h-full w-full pr-2">
      <div
        ref={treeViewportRef}
        className="h-full w-full overflow-x-auto overflow-y-hidden custom-scrollbar overscroll-y-contain"
        style={{
          height: `calc(100% - ${OUTLINE_TREE_BOTTOM_OFFSET}px)`,
        }}
      >
        <div className="min-h-full min-w-max">
          <Tree
            fieldNames={{ title: "desc", key: "id" }}
            treeData={treeData as any}
            showLine={{
              showLeafIcon: false,
            }}
            expandedKeys={expandedKeys}
            height={treeHeight}
            virtual
            allowDrop={allowDrop}
            draggable={{ icon: false }}
            onExpand={(nextExpandedKeys) => {
              setExpandedKeys(nextExpandedKeys);
            }}
            onDrop={onDrop}
            onSelect={([selectedKey]) => {
              if (selectedKey != null) {
                setCurComponentId(selectedKey as number);
              }
            }}
            style={{ minWidth: "max-content" }}
          />
        </div>
      </div>
    </div>
  );
}
