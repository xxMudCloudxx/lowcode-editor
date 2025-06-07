/**
 * @file /src/editor/components/EditArea/index.tsx
 * @description
 * 编辑器的主画布区域。
 * 负责：
 * - 递归渲染 `components` store 中的组件树（的 dev 版本）。
 * - 通过事件委托（Event Delegation）处理整个画布的鼠标悬浮和点击事件，以确定当前 hover 和 selected 的组件。
 * - 条件性地渲染 HoverMask 和 SelectedMask 来提供视觉反馈。
 * @module Components/EditArea
 */

import React, { useState, type MouseEventHandler } from "react";
import { useComponetsStore, type Component } from "../../stores/components";
import { useComponentConfigStore } from "../../stores/component-config";
import HoverMask from "./HoverMask";
import SelectedMask from "./SelectedMask";

export function EditArea() {
  const { components, curComponentId, setCurComponentId } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // 使用 state 追踪当前鼠标悬浮在其上的组件 ID
  const [hoverComponentId, setHoverComponentId] = useState<number>();

  /**
   * @description 鼠标悬浮事件处理器。
   * 采用事件委托模式，监听整个 EditArea 的 onMouseOver 事件。
   * 通过 `e.nativeEvent.composedPath()` 向上追溯 DOM 树，
   * 找到第一个带有 `data-component-id` 属性的元素，以确定悬浮的组件。
   * 这样做性能更高，因为无需为每个渲染的组件都单独绑定事件监听器。
   */
  const handleMouseOver: MouseEventHandler = (e) => {
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
  };

  /**
   * @description 鼠标点击事件处理器。
   * 逻辑与 handleMouseOver 类似，同样采用事件委托。
   * 用于设置当前选中的组件 ID。
   */
  const handleClick: MouseEventHandler = (e) => {
    const path = e.nativeEvent.composedPath();
    for (let i = 0; i < path.length; i++) {
      const ele = path[i] as HTMLElement;

      const componentId = ele.dataset.componentId;
      if (componentId) {
        setCurComponentId(+componentId);
        return;
      }
    }
  };

  /**
   * @description 递归渲染函数。
   * 遍历组件树，并使用 React.createElement 动态创建每个组件的“开发版本”(`dev`)。
   * `dev` 版本组件通常包含了用于编辑器交互的额外逻辑（如 useDrag, useDrop）。
   * @param {Component[]} components - 要渲染的组件（或子组件）数组。
   * @returns {React.ReactNode} - 渲染出的 React 节点。
   */
  function renderComponents(components: Component[]): React.ReactNode {
    return components.map((component: Component) => {
      const config = componentConfig?.[component.name];

      // 如果找不到组件配置或没有 dev 版本，则不渲染
      if (!config?.dev) {
        return null;
      }

      // 使用 React.createElement 动态创建组件实例
      // 将 store 中的 props 和 config 中的 defaultProps 传递下去
      return React.createElement(
        config.dev,
        {
          key: component.id,
          id: component.id,
          name: component.name,
          styles: component.styles,
          ...config.defaultProps,
          ...component.props,
        },
        // 递归渲染子组件
        renderComponents(component.children || [])
      );
    });
  }
  return (
    <div
      className="h-[100%] edit-area"
      onMouseOver={handleMouseOver}
      onMouseLeave={() => {
        // 鼠标移出整个画布区域时，清空 hover 状态
        setHoverComponentId(undefined);
      }}
      onClick={handleClick}
    >
      {renderComponents(components)}

      {/* 当有悬浮组件且该组件不是当前选中的组件时，显示悬浮遮罩 */}
      {hoverComponentId &&
        hoverComponentId !== curComponentId &&
        hoverComponentId !== 1 && (
          <HoverMask
            portalWrapperClassName="portal-wrapper"
            containerClassName="edit-area"
            componentId={hoverComponentId}
          />
        )}

      {/* 当有选中组件时，显示选中遮罩 */}
      {curComponentId && (
        <SelectedMask
          portalWrapperClassName="portal-wrapper"
          containerClassName="edit-area"
          componentId={curComponentId}
        />
      )}

      {/* 这个 div 是给 HoverMask 和 SelectedMask 的 React Portal 准备的目标挂载点 */}
      <div className="portal-wrapper"></div>
    </div>
  );
}
