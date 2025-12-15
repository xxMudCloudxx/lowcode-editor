/**
 * @file useCanvasInteraction.ts
 * @description
 * 处理画布交互事件的 Hook。
 * 包括鼠标悬浮、点击选中、光标同步等逻辑。
 */

import { useState, useCallback, type MouseEventHandler } from "react";
import { useComponentsStore } from "../../../stores/components";
import { useComponentConfigStore } from "../../../stores/component-config";
import { useUIStore } from "../../../stores/uiStore";
import { useCollaborationStore } from "../../../stores/collaborationStore";
import { sendCursorPosition } from "../../../hooks/useCollaboration";

export interface CanvasInteractionResult {
  /** 当前悬浮的组件 ID */
  hoverComponentId: number | undefined;
  /** 鼠标悬浮事件处理器 */
  handleMouseOver: MouseEventHandler;
  /** 鼠标离开事件处理器 */
  handleMouseLeave: () => void;
  /** 鼠标移动事件处理器（用于光标同步） */
  handleMouseMove: MouseEventHandler;
  /** 点击事件处理器（捕获阶段） */
  handleClickCapture: MouseEventHandler;
  /** 是否禁用交互 */
  isDisabled: boolean;
}

/**
 * 处理画布交互事件
 * @param scale 当前缩放比例
 * @returns 交互事件处理器和状态
 */
export function useCanvasInteraction(scale: number): CanvasInteractionResult {
  const { components } = useComponentsStore();
  const { curComponentId, setCurComponentId } = useUIStore();
  const { componentConfig } = useComponentConfigStore();
  const { editorMode, isConnected } = useCollaborationStore();

  // 联机模式下断开连接时禁用编辑
  const isDisabled = editorMode === "live" && !isConnected;

  // 使用 state 追踪当前鼠标悬浮在其上的组件 ID
  const [hoverComponentId, setHoverComponentId] = useState<number>();

  /**
   * @description 鼠标悬浮事件处理器。
   * 采用事件委托模式，监听整个 EditArea 的 onMouseOver 事件。
   * 通过 `e.nativeEvent.composedPath()` 向上追溯 DOM 树，
   * 找到第一个带有 `data-component-id` 属性的元素，以确定悬浮的组件。
   */
  const handleMouseOver: MouseEventHandler = useCallback((e) => {
    // composedPath() 返回一个包含事件路径上所有节点的数组（从目标到窗口）
    const path = e.nativeEvent.composedPath();

    for (let i = 0; i < path.length; i += 1) {
      const ele = path[i] as HTMLElement;

      const componentId = ele.dataset?.componentId;
      if (componentId) {
        // 找到最近的带 ID 的组件，更新 hover 状态并立即返回
        setHoverComponentId(+componentId);
        return;
      }
    }
  }, []);

  /**
   * 鼠标离开画布事件处理器
   */
  const handleMouseLeave = useCallback(() => {
    setHoverComponentId(undefined);
    // 鼠标离开画布时，发送隐藏光标的消息（使用 -1, -1 表示隐藏）
    if (editorMode === "live") {
      sendCursorPosition(-1, -1);
    }
  }, [editorMode]);

  /**
   * 鼠标移动事件处理器（用于协作光标同步）
   */
  const handleMouseMove: MouseEventHandler = useCallback(
    (e) => {
      if (editorMode !== "live") return;

      // 发送光标位置（相对于 simulator-container）
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      // 除以 scale 还原逻辑坐标
      const x = (e.clientX - rect.left) / scale + container.scrollLeft;
      const y = (e.clientY - rect.top) / scale + container.scrollTop;
      sendCursorPosition(x, y);
    },
    [editorMode, scale]
  );

  /**
   * @description 鼠标点击事件处理器（捕获阶段）
   *
   * 关键设计：使用 onClickCapture 而非 onClick
   * - 捕获阶段 > 目标阶段 > 冒泡阶段
   * - 即使业务组件内部调用了 e.stopPropagation()，也不会阻止编辑器的选中逻辑
   * - 编辑器的"选中"行为拥有最高优先级
   *
   * 事件策略：
   * - interactiveInEditor: false → 拦截事件（preventDefault + stopPropagation）
   * - interactiveInEditor: true → 仅更新选中状态，不拦截事件
   */
  const handleClickCapture: MouseEventHandler = useCallback(
    (e) => {
      const path = e.nativeEvent.composedPath();

      for (let i = 0; i < path.length; i++) {
        const ele = path[i] as HTMLElement;
        const componentId = ele.dataset?.componentId;

        if (componentId) {
          const id = +componentId;
          const component = components[id];
          if (!component) continue;

          const config = componentConfig?.[component.name];
          if (!config) continue;

          // 判断是否允许编辑器内交互
          const allowInteraction = config.editor.interactiveInEditor ?? false;

          if (!allowInteraction) {
            // 普通组件：拦截事件，仅做选中
            // 阻止事件继续传播到目标和冒泡阶段
            e.stopPropagation();
            e.preventDefault();
          }
          // else: 交互组件（如 Tabs）：不拦截，让原生事件继续

          // 无论如何都更新选中状态
          if (curComponentId === id) {
            setCurComponentId(null);
          } else {
            setCurComponentId(id);
          }
          return;
        }
      }
    },
    [components, componentConfig, curComponentId, setCurComponentId]
  );

  return {
    hoverComponentId,
    handleMouseOver,
    handleMouseLeave,
    handleMouseMove,
    handleClickCapture,
    isDisabled,
  };
}
