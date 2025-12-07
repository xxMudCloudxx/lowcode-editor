/**
 * @file /src/editor/components/EditArea/index.tsx
 * @description
 * 编辑器的主画布区域。
 * 负责：
 * - 基于 `components` store 中的范式化组件 Map 递归渲染组件树
 * - 通过事件委托（捕获阶段）处理画布的鼠标悬浮和点击事件
 * - 条件性地渲染 HoverMask / SelectedMask 来提供视觉反馈
 *
 * v2 架构变更：
 * - 使用 onClickCapture 替代 onClick，确保编辑器选中逻辑最高优先级
 * - 支持新协议格式（ComponentProtocol）和旧格式（dev/prod）
 * - 使用 DraggableNode 注入拖拽能力，零额外 DOM
 *
 * @module Components/EditArea
 */

import React, {
  Suspense,
  useMemo,
  useState,
  useCallback,
  type MouseEventHandler,
} from "react";
import { ConfigProvider } from "antd";
import { useComponentsStore } from "../../stores/components";
import { useComponentConfigStore } from "../../stores/component-config";
import { useUIStore } from "../../stores/uiStore";
import HoverMask from "./HoverMask";
import SelectedMask from "./SelectedMask";
import LoadingPlaceholder from "../common/LoadingPlaceholder";
import { DraggableNode } from "./DraggableNode";
import { isProtocolConfig } from "../../types/component-protocol";

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
          const allowInteraction = isProtocolConfig(config)
            ? (config.editor.interactiveInEditor ?? false)
            : false; // 旧格式默认不允许交互

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

  /**
   * 判断组件是否为容器
   *
   * 规则：
   * 1. 新协议格式：读取 editor.isContainer
   * 2. 旧格式：检查是否有其他组件的 parentTypes 包含此组件名
   */
  const isContainerComponent = useCallback(
    (name: string): boolean => {
      const config = componentConfig?.[name];
      if (!config) return false;

      // 新协议格式：直接读取 editor.isContainer
      if (isProtocolConfig(config)) {
        return config.editor.isContainer ?? false;
      }

      // 旧格式：检查是否有其他组件将此组件列为 parentType
      // 如果有，说明此组件是可以容纳子组件的容器
      return Object.values(componentConfig).some((otherConfig) => {
        if (isProtocolConfig(otherConfig)) {
          return otherConfig.editor.parentTypes?.includes(name);
        }
        return otherConfig.parentTypes?.includes(name);
      });
    },
    [componentConfig]
  );

  /**
   * 基于范式化 Map 的递归渲染函数。
   *
   * v2 变更：
   * - 支持新协议格式（component）和旧格式（dev）
   * - 使用 DraggableNode 注入拖拽能力
   */
  const RenderNode = useCallback(
    ({ id }: { id: number }) => {
      const component = components[id];
      if (!component) return null;

      const config = componentConfig?.[component.name];
      if (!config) return null;

      // 判断配置格式：新协议 vs 旧格式
      const isProtocol = isProtocolConfig(config);

      // 获取要渲染的组件
      const ComponentToRender = isProtocol ? config.component : config.dev;

      if (!ComponentToRender) return null;

      // 判断是否为容器组件
      const isContainer = isContainerComponent(component.name);

      return (
        <Suspense
          key={component.id}
          fallback={<LoadingPlaceholder componentDesc={config.desc} />}
        >
          <DraggableNode
            id={component.id}
            name={component.name}
            isContainer={isContainer}
          >
            {React.createElement(
              ComponentToRender,
              {
                // 旧格式需要这些属性
                ...(isProtocol
                  ? {}
                  : {
                      id: component.id,
                      name: component.name,
                      isSelected: component.id === curComponentId,
                    }),
                // 通用属性
                ...config.defaultProps,
                ...component.props,
                style: component.styles,
              },
              component.children?.map((childId) => (
                <RenderNode key={childId} id={childId} />
              ))
            )}
          </DraggableNode>
        </Suspense>
      );
    },
    [components, componentConfig, curComponentId, isContainerComponent]
  );

  const componentTree = useMemo(() => {
    return rootId ? <RenderNode id={rootId} /> : null;
  }, [rootId, RenderNode]);

  return (
    <div
      className="h-full edit-area overflow-y-auto relative p-6 overflow-x-auto w-full"
      onMouseOver={handleMouseOver}
      onMouseLeave={() => {
        setHoverComponentId(undefined);
      }}
      // 关键：使用捕获阶段处理点击事件，确保编辑器选中逻辑最高优先级
      onClickCapture={handleClickCapture}
      style={{
        background: `
          radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
          radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
          linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
        `,
        backgroundSize: "50px 50px, 100px 100px, 100% 100%",
      }}
    >
      {/* 重置 Antd 主题为默认，让画布中的组件使用默认颜色 */}
      <ConfigProvider theme={{ inherit: false }}>
        {componentTree}
      </ConfigProvider>

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
