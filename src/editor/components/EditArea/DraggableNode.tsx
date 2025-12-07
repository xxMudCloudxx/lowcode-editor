/**
 * @file DraggableNode.tsx
 * @description 拖拽能力注入层
 *
 * 核心设计：
 * 1. 用 cloneElement 注入 ref 和 data-component-id，零额外 DOM 层级
 * 2. 用 useMergeRefs 合并 ref，不覆盖子组件原有的 ref
 * 3. 开发环境校验 ref 转发是否正确
 *
 * @module Components/EditArea/DraggableNode
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
import { useDrag } from "react-dnd";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";
import { mergeRefs } from "../../hooks/useMergeRefs";
import { validateRefForwarding } from "../../types/component-protocol";

interface DraggableNodeProps {
  /** 组件实例 ID */
  id: number;
  /** 组件类型名称 */
  name: string;
  /** 是否为容器组件（支持 drop） */
  isContainer: boolean;
  /** 子元素（渲染后的纯净组件） */
  children: ReactNode;
}

/**
 * DraggableNode - 拖拽能力注入层
 *
 * 关键技术：cloneElement + mergeRefs
 * - 不添加额外 DOM 包裹层
 * - 直接把 ref 和 data-component-id 注入到子元素根节点
 * - 合并原有 ref，不破坏外部逻辑
 * - 保持原有 Flex/Grid 布局不被破坏
 */
export function DraggableNode({
  id,
  name,
  isContainer,
  children,
}: DraggableNodeProps) {
  const nodeRef = useRef<HTMLElement>(null);

  // 拖拽能力 - 所有组件都可拖拽（画布内移动）
  const [, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move" as const, id },
  });

  // 放置能力 - 仅容器组件支持
  const { drop, isOver } = useMaterailDrop(id, name);

  // 连接 drag/drop ref
  useEffect(() => {
    if (nodeRef.current) {
      drag(nodeRef);
      if (isContainer) {
        drop(nodeRef);
      }

      // 开发环境校验 ref 转发
      validateRefForwarding(name, nodeRef.current);
    }
  }, [drag, drop, isContainer, name]);

  // 核心：cloneElement 注入，零额外 DOM
  if (isValidElement(children)) {
    const childElement = children as ReactElement<{
      style?: CSSProperties;
      ref?: React.Ref<HTMLElement>;
    }>;

    const childStyle = childElement.props.style || {};
    const childRef = childElement.props.ref;

    // 使用 mergeRefs 合并 ref，不覆盖子组件原有的 ref
    const mergedRef = mergeRefs(nodeRef, childRef);

    return cloneElement(childElement, {
      ref: mergedRef,
      "data-component-id": id,
      "data-component-type": name, // 注入组件类型，供 CSS 作用域瞄准
      style: {
        ...childStyle,
        // 容器悬浮时的视觉反馈
        ...(isContainer && isOver
          ? {
              outline: "2px solid var(--ant-color-primary, #1677ff)",
              outlineOffset: "-2px",
            }
          : {}),
      },
    } as React.Attributes & {
      ref: typeof mergedRef;
      "data-component-id": number;
      "data-component-type": string;
      style: CSSProperties;
    });
  }

  // Fallback：对于非 ReactElement（如文本、Fragment），需要包裹
  // 这种情况较少见，因为物料组件一般都是 ReactElement
  return (
    <span
      ref={nodeRef as React.RefObject<HTMLSpanElement>}
      data-component-id={id}
    >
      {children}
    </span>
  );
}
