/**
 * @file /src/editor/components/EditArea/index.tsx
 * @description
 * 编辑器的主画布区域。
 * 负责：
 * - 基于 `components` store 中的范式化组件 Map 递归渲染组件树（dev 版本）
 * - 通过事件委托处理画布的鼠标悬浮和点击事件，确定当前 hover / selected 的组件
 * - 条件性地渲染 HoverMask / SelectedMask 来提供视觉反馈
 * @module Components/EditArea
 */

import React, {
  Suspense,
  useMemo,
  useState,
  type MouseEventHandler,
} from "react";
import { useComponentsStore } from "../../stores/components";
import { useComponentConfigStore } from "../../stores/component-config";
import { useUIStore } from "../../stores/uiStore";
import HoverMask from "./HoverMask";
import SelectedMask from "./SelectedMask";
import LoadingPlaceholder from "../common/LoadingPlaceholder";

export function EditArea() {
  const { components, rootId } = useComponentsStore();
  const { curComponentId, setCurComponentId } = useUIStore();
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
    for (let i = 0; i < path.length; i += 1) {
      const ele = path[i] as HTMLElement;
      if (ele && ele.dataset) {
        const componentId = ele.dataset.componentId;
        if (componentId) {
          const id = +componentId;
          if (curComponentId === id) {
            setCurComponentId(null);
          } else {
            setCurComponentId(id);
          }
          return;
        }
      }
    }
  };

  /**
   * 基于范式化 Map 的递归渲染函数。
   * 通过组件 id 从 Map 中取出节点，查找其 dev 版本组件并渲染，
   * 再根据 children id 列表递归渲染子节点。
   */
  const RenderNode = ({ id }: { id: number }) => {
    const component = components[id];
    if (!component) return null;

    const config = componentConfig?.[component.name];
    if (!config?.dev) {
      return null;
    }

    return (
      <Suspense
        key={component.id}
        fallback={<LoadingPlaceholder componentDesc={config.desc} />}
      >
        {React.createElement(
          config.dev,
          {
            key: component.id,
            id: component.id,
            name: component.name,
            styles: component.styles,
            isSelected: component.id === curComponentId,
            ...config.defaultProps,
            ...component.props,
          },
          component.children?.map((childId) => (
            <RenderNode key={childId} id={childId} />
          ))
        )}
      </Suspense>
    );
  };

  const componentTree = useMemo(() => {
    return rootId ? <RenderNode id={rootId} /> : null;
  }, [rootId, components, componentConfig, curComponentId]);

  return (
    <div
      className="h-full edit-area overflow-y-auto relative p-6 overflow-x-auto w-full"
      onMouseOver={handleMouseOver}
      onMouseLeave={() => {
        // 鼠标移出整个画布区域时，清空 hover 状态
        setHoverComponentId(undefined);
      }}
      onClick={handleClick}
      style={{
        background: `
          radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
          radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
          linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
        `,
        backgroundSize: "50px 50px, 100px 100px, 100% 100%",
      }}
    >
      {componentTree}

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
