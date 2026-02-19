/**
 * @file renderer/components/RendererDraggableNode.tsx
 * @description
 * Iframe 内的拖拽能力注入层。
 * 基于原 DraggableNode 改造，核心差异：
 * - 使用 rendererStore 代替 useComponentsStore
 * - 拖拽排序结果通过 SimulatorRenderer.dispatchAction 委托给 Host
 * - 同时支持接收来自主窗口的原生拖拽（NativeTypes）
 *
 * @module Renderer/Components/RendererDraggableNode
 */

import {
  cloneElement,
  isValidElement,
  useRef,
  useEffect,
  type ReactNode,
  type ReactElement,
  type CSSProperties,
} from "react";
import { useDrag, useDrop, type ConnectDropTarget } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { mergeRefs } from "../../editor/hooks/useMergeRefs";
import { useRendererStore } from "../stores/rendererStore";
import { simulatorRenderer } from "../../editor/simulator/SimulatorRenderer";
import { materials, type ComponentConfig } from "@lowcode/materials";

// 物料配置 Map
const componentConfigMap: Record<string, ComponentConfig> = {};
for (const m of materials) {
  componentConfigMap[m.name] = m;
}

/** 拖拽 Item 类型（iframe 内部拖拽排序） */
interface InternalDragItem {
  type: string;
  dragType: "move";
  id: number;
}

interface RendererDraggableNodeProps {
  id: number;
  name: string;
  isContainer: boolean;
  children: ReactNode;
}

export function RendererDraggableNode({
  id,
  name,
  isContainer,
  children,
}: RendererDraggableNodeProps) {
  const nodeRef = useRef<HTMLElement>(null);

  // ========== 内部拖拽（画布内移动） ==========
  const [, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move" as const, id },
  });

  // ========== 放置能力 ==========

  // 计算 accept 列表（同原 useMatrialDrop 逻辑）
  const accept = isContainer
    ? [
        // 接受内部组件拖拽
        ...Object.values(componentConfigMap)
          .filter((config) => config.editor.parentTypes?.includes(name))
          .map((config) => config.name),
        // 接受从主窗口拖入的原生拖拽
        NativeTypes.TEXT,
      ]
    : [];

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept,
      canDrop: (item: InternalDragItem, monitor) => {
        // 原生拖拽（从主窗口拖入）
        if (monitor.getItemType() === NativeTypes.TEXT) {
          return true;
        }

        // 内部拖拽：防止自我嵌套
        if (item.dragType === "move") {
          if (item.id === id) return false;

          // 防止循环嵌套：检查 containerId 是否是 item.id 的后代
          const components = useRendererStore.getState().components;
          let current = components[id];
          while (current && current.parentId != null) {
            if (current.parentId === item.id) return false;
            current = components[current.parentId];
          }
        }

        return true;
      },
      drop: (item: InternalDragItem, monitor) => {
        // 防止冒泡重复处理
        if (monitor.didDrop()) return;

        if (monitor.getItemType() === NativeTypes.TEXT) {
          // 来自主窗口的原生拖拽
          const draggingMaterial = useRendererStore.getState().draggingMaterial;
          if (draggingMaterial) {
            simulatorRenderer.dispatchAction(
              "addComponent",
              {
                desc: draggingMaterial.desc,
                id: Date.now(),
                name: draggingMaterial.componentName,
                props: draggingMaterial.defaultProps,
              },
              id,
            );
          }
        } else if (item.dragType === "move") {
          // 内部移动
          simulatorRenderer.dispatchAction("moveComponents", item.id, id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [id, name, accept],
  );

  // 连接 drag/drop ref
  useEffect(() => {
    if (nodeRef.current) {
      drag(nodeRef);
      if (isContainer) {
        drop(nodeRef);
      }
    }
  }, [drag, drop, isContainer]);

  // ========== 渲染 ==========

  if (isValidElement(children)) {
    const childElement = children as ReactElement<{
      style?: CSSProperties;
      ref?: React.Ref<HTMLElement>;
    }>;

    const childStyle = childElement.props.style || {};
    const childRef = childElement.props.ref;
    const mergedRef = mergeRefs(nodeRef, childRef);

    return cloneElement(childElement, {
      ref: mergedRef,
      "data-component-id": id,
      "data-component-type": name,
      "data-is-over": isContainer && isOver ? "true" : undefined,
      style: { ...childStyle },
    } as React.Attributes & {
      ref: typeof mergedRef;
      "data-component-id": number;
      "data-component-type": string;
      "data-is-over"?: string;
      style: CSSProperties;
    });
  }

  return (
    <span
      ref={nodeRef as React.RefObject<HTMLSpanElement>}
      data-component-id={id}
    >
      {children}
    </span>
  );
}
