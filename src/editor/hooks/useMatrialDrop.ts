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
import { getComponentById, useComponetsStore } from "../stores/components";

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
  const { addComponent, components, deleteComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // 核心解耦逻辑：动态计算可接受的子组件类型列表。
  // 遍历所有组件的“蓝图”，筛选出那些在其 `parentTypes` 数组中包含了当前容器名称的组件。
  const accept = Object.values(componentConfig)
    .filter((config) => config.parentTypes?.includes(containerName))
    .map((config) => config.name);

  const [{ canDrop }, drop] = useDrop(() => ({
    // 使用动态计算出的 accept 列表
    accept,
    drop: (item: ItemType, monitor) => {
      // 防止在嵌套的放置目标中重复触发 drop
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }

      // 根据拖拽来源是“移动”还是“新增”来执行不同逻辑
      if (item.dragType === "move") {
        const component = getComponentById(item.id, components)!;

        // 关键操作：先删除旧位置的组件，再添加到新位置
        deleteComponent(item.id);
        addComponent(component, containerId);
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
    }),
  }));

  return { canDrop, drop };
}
