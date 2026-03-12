/**
 * @file renderer/components/RendererDraggableNode.tsx
 * @description
 * 纯渲染 Wrapper，仅注入拖拽所需的 data-* 属性和 draggable 标记。
 * 所有 DnD 事件由 useDelegatedDnD hook 通过事件委托在容器级别统一处理，
 * 此组件不注册任何 DnD 实例，确保 O(1) 运行时开销。
 *
 * @module Renderer/Components/RendererDraggableNode
 */

import {
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type CSSProperties,
} from "react";

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
  // 根组件（Page, id=1）不可拖拽
  const isDraggable = id !== 1;

  if (isValidElement(children)) {
    const childElement = children as ReactElement<{
      style?: CSSProperties;
    }>;

    return cloneElement(childElement, {
      draggable: isDraggable ? true : undefined,
      "data-component-id": id,
      "data-component-type": name,
      "data-is-container": isContainer ? "true" : undefined,
    } as React.Attributes & {
      draggable?: boolean;
      "data-component-id": number;
      "data-component-type": string;
      "data-is-container"?: string;
    });
  }

  return (
    <span
      draggable={isDraggable ? true : undefined}
      data-component-id={id}
      data-component-type={name}
      data-is-container={isContainer ? "true" : undefined}
    >
      {children}
    </span>
  );
}
