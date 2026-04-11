/**
 * @file renderer/components/RendererDraggableNode.tsx
 * @description
 * 纯渲染 Wrapper，仅注入拖拽所需的 data-* 属性、稳定 class 和 draggable 标记。
 * 所有 DnD 事件由 useDelegatedDnD hook 通过事件委托在容器级统一处理。
 */

import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import clsx from "clsx";

interface RendererDraggableNodeProps {
  id: number;
  name: string;
  isContainer: boolean;
  children: ReactNode;
}

function toEditorTypeClass(name: string): string {
  return `editor-type-${name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .toLowerCase()}`;
}

export function RendererDraggableNode({
  id,
  name,
  isContainer,
  children,
}: RendererDraggableNodeProps) {
  const isDraggable = id !== 1;
  const injectedClassName = clsx(
    "editor-node",
    toEditorTypeClass(name),
    isContainer && "editor-container",
  );

  if (isValidElement(children)) {
    const childElement = children as ReactElement<{
      className?: string;
      style?: CSSProperties;
    }>;

    return cloneElement(childElement, {
      draggable: isDraggable ? true : undefined,
      className: clsx(childElement.props.className, injectedClassName),
      "data-component-id": id,
      "data-component-type": name,
      "data-is-container": isContainer ? "true" : undefined,
    } as React.Attributes & {
      className?: string;
      draggable?: boolean;
      "data-component-id": number;
      "data-component-type": string;
      "data-is-container"?: string;
    });
  }

  return (
    <span
      className={injectedClassName}
      draggable={isDraggable ? true : undefined}
      data-component-id={id}
      data-component-type={name}
      data-is-container={isContainer ? "true" : undefined}
    >
      {children}
    </span>
  );
}
