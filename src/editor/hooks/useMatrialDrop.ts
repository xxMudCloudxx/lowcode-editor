import { useDrop } from "react-dnd";
import { useComponentConfigStore } from "../stores/component-config";
import { getComponentById, useComponetsStore } from "../stores/components";

export interface ItemType {
  type: string;
  dragType?: "move" | "add";
  id: number;
}

/**
 * @description 一个自定义 Hook，用于处理物料的拖放逻辑。
 * 它封装了 react-dnd 的 `useDrop`，使其可以接收一个组件 ID，
 * 并在有物料（新物料或移动的现有物料）放置到该组件上时，
 * 调用 Zustand store 中相应的 action (addComponent, deleteComponent) 来更新组件树。
 *
 * @param {string[]} accept - 一个字符串数组，定义了可以接收的物料类型 (component.name)。
 * @param {number} id - 目标容器组件的 ID，新组件将被添加到这个容器中。
 * @returns {{ canDrop: boolean; drop: ConnectDropTarget }}
 * - canDrop: 一个布尔值，指示当前是否有可接受的物料悬停在上方。
 * - drop: 一个连接函数，需要将其附加到目标 DOM 节点的 ref 上。
 */
export function useMaterailDrop(accept: string[], id: number) {
  const { addComponent, components, deleteComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  const [{ canDrop }, drop] = useDrop(() => ({
    accept,
    drop: (item: ItemType, monitor) => {
      // 防止在嵌套的放置目标中触发drop
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }

      // 根据拖拽来源是"移动"还是"新增"来执行不同的逻辑
      if (item.dragType === "move") {
        const component = getComponentById(item.id, components)!;

        // 关键操作：先删除旧位置的组件，再添加到新位置
        deleteComponent(item.id);
        addComponent(component, id);
      } else {
        const config = componentConfig[item.type];

        addComponent(
          {
            desc: config.desc,
            id: new Date().getTime(),
            name: item.type,
            props: config.defaultProps,
          },
          id
        );
      }
    },
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
    }),
  }));

  return { canDrop, drop };
}
