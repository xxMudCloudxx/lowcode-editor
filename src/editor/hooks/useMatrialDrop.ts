/**
 * @file /src/editor/hooks/useMatrialDrop.ts
 * @description
 * 提供物料拖放核心逻辑的自定义 Hook。
 * 经过重构，此 Hook 不再接收一个写死的 `accept` 列表，
 * 而是动态地根据“父容器”的类型，从 `componentConfig` 中计算出所有可以将该容器作为父容器的子组件类型列表。
 * 这种“反向注册”的模式，极大地解耦了容器组件和子组件之间的关系。
 * @module Hooks/useMaterailDrop
 */
import { useDrop } from "react-dnd";
import { useComponentConfigStore } from "../stores/component-config";
import {
  getComponentById,
  isDescendantOf,
  useComponetsStore,
} from "../stores/components";

export interface ItemType {
  type: string;
  dragType?: "move" | "add";
  id: number;
}

/**
 * @description 一个“智能”的 useDrop Hook 封装，用于处理编辑器中的组件拖放。
 * @param {number} containerId - 接收拖放的容器组件的实例 ID。
 * @param {string} containerName - 接收拖放的容器组件的类型名称 (e.g., 'Page', 'Container')。Hook 将使用此名称来查找所有将它声明为 `parentTypes` 的子组件。
 * @returns {{ canDrop: boolean; drop: ConnectDropTarget }}
 * - canDrop: 一个布尔值，指示当前是否有可接受的物料悬停在上方。
 * - drop: 一个 react-dnd 连接函数，需要将其附加到目标 DOM 节点的 ref 上。
 * @see /src/editor/stores/component-config.tsx - 本 Hook 的逻辑依赖于组件配置中的 `parentTypes` 属性。
 */
export function useMaterailDrop(containerId: number, containerName: string) {
  const { addComponent, deleteComponent, moveComponents } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // 核心解耦逻辑：动态计算可接受的子组件类型列表。
  // 遍历所有组件的“蓝图”，筛选出那些在其 `parentTypes` 数组中包含了当前容器名称的组件。
  const accept = Object.values(componentConfig)
    .filter((config) => config.parentTypes?.includes(containerName))
    .map((config) => config.name);

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    // 使用动态计算出的 accept 列表
    accept,
    canDrop: (item: ItemType) => {
      // 需要获取最新的components，不然会使用上个快照的旧components
      const { components } = useComponetsStore.getState();
      // 如果是移动操作，需要进行额外的校验
      if (item.dragType === "move") {
        // 关键校验：防止组件被拖拽到它自身内部。
        if (item.id === containerId) {
          return false;
        }

        // 关键校验：防止父级组件被拖拽到其任何一个后代组件中，避免形成数据结构的死循环。
        if (isDescendantOf(containerId, item.id, components)) {
          return false;
        }
      }

      // 对于所有其他情况（如从物料区新增组件），只要类型匹配即可放置。
      return true;
    },
    drop: (item: ItemType, monitor) => {
      // 关键优化：检查放置动作是否已经被更深层的子容器处理过。
      // 这可以防止在一个嵌套结构中，事件冒泡导致父容器重复执行放置逻辑。
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }

      // 根据拖拽来源是“移动”还是“新增”来执行不同逻辑
      if (item.dragType === "move") {
        moveComponents(item.id, containerId);
      } else {
        const config = componentConfig[item.type];

        addComponent(
          {
            desc: config.desc,
            id: new Date().getTime(),
            name: item.type,
            props: config.defaultProps,
          },
          containerId
        );
      }
    },
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
      // 判断“鼠标是不是严格地、直接地悬浮在我的上方，而不是在我的后代上方”
      isOver: monitor.isOver({ shallow: true }),
    }),
  }));

  return { canDrop, drop, isOver };
}
