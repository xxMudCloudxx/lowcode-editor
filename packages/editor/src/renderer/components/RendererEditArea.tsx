/**
 * @file renderer/components/RendererEditArea.tsx
 * @description
 * Iframe 内的编辑画布区域。
 * 基于原 EditArea 改造，核心差异：
 * - 从 rendererStore（Slave Store）读取数据，而非 useComponentsStore
 * - 交互事件通过 SimulatorRenderer 的 postMessage 传递给 Host
 * - 独立的 DndProvider 上下文（由 RendererApp 提供）
 *
 * @module Renderer/Components/RendererEditArea
 */

import React, {
  Suspense,
  useMemo,
  useState,
  useCallback,
  type MouseEventHandler,
  type CSSProperties,
} from "react";
import { useRendererStore } from "../stores/rendererStore";
import { simulatorRenderer } from "../../editor/simulator/SimulatorRenderer";
import { materials, type ComponentConfig } from "@lowcode/materials";
import { RendererDraggableNode } from "./RendererDraggableNode";
import { RendererHoverMask } from "./RendererHoverMask";
import { RendererSelectedMask } from "./RendererSelectedMask";

// 物料配置 Map（在 iframe 内本地构建，避免依赖 Host 的 componentConfig Store）
const componentConfigMap: Record<string, ComponentConfig> = {};
for (const m of materials) {
  componentConfigMap[m.name] = m;
}

export function RendererEditArea() {
  const { components, rootId, curComponentId } = useRendererStore();
  const [hoverComponentId, setHoverComponentId] = useState<number>();

  // ==================== 样式 ====================

  const simulatorStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      minHeight: "100%",
      position: "relative",
      overflow: "visible",
      backgroundColor: "#fff",
    };
  }, []);

  const workspaceStyle = useMemo<CSSProperties>(() => {
    return {
      display: "flex",
      justifyContent: "stretch",
      alignItems: "stretch",
      width: "100%",
      height: "100%",
      background: `
        radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
        radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
        linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
      `,
      backgroundSize: "50px 50px, 100px 100px, 100% 100%",
    };
  }, []);

  // ==================== 事件处理 ====================

  /**
   * 鼠标悬浮事件 — 直接在 iframe 内处理，不需要 postMessage
   */
  const handleMouseOver: MouseEventHandler = (e) => {
    const path = e.nativeEvent.composedPath();
    for (let i = 0; i < path.length; i += 1) {
      const ele = path[i] as HTMLElement;
      const componentId = ele.dataset?.componentId;
      if (componentId) {
        setHoverComponentId(+componentId);
        return;
      }
    }
  };

  /**
   * 点击事件（捕获阶段） — 选中组件并通知 Host
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

          const config = componentConfigMap[component.name];
          if (!config) continue;

          const allowInteraction = config.editor.interactiveInEditor ?? false;

          if (!allowInteraction) {
            e.stopPropagation();
            e.preventDefault();
          }

          // 通知 Host 选中了组件
          const newId = curComponentId === id ? null : id;
          simulatorRenderer.selectComponent(newId);
          return;
        }
      }
    },
    [components, curComponentId],
  );

  // ==================== 容器判断 ====================

  const isContainerComponent = useCallback((name: string): boolean => {
    const config = componentConfigMap[name];
    if (!config) return false;
    return config.editor.isContainer ?? false;
  }, []);

  // ==================== 渲染 ====================

  const RenderNode = useCallback(
    ({ id }: { id: number }) => {
      const component = components[id];
      if (!component) return null;

      const config = componentConfigMap[component.name];
      if (!config) return null;

      const ComponentToRender = config.component;
      if (!ComponentToRender) return null;

      const isContainer = isContainerComponent(component.name);

      return (
        <Suspense
          key={component.id}
          fallback={<div style={{ padding: 8, color: "#999" }}>Loading...</div>}
        >
          <RendererDraggableNode
            id={component.id}
            name={component.name}
            isContainer={isContainer}
          >
            {React.createElement(
              ComponentToRender,
              {
                ...config.defaultProps,
                ...component.props,
                style: component.styles,
              },
              component.children?.map((childId) => (
                <RenderNode key={childId} id={childId} />
              )),
            )}
          </RendererDraggableNode>
        </Suspense>
      );
    },
    [components, isContainerComponent],
  );

  const componentTree = useMemo(() => {
    return rootId ? <RenderNode id={rootId} /> : null;
  }, [rootId, RenderNode]);

  return (
    <div
      className="h-full edit-area overflow-auto relative"
      style={workspaceStyle}
    >
      <div
        className="simulator-container"
        style={simulatorStyle}
        onMouseOver={handleMouseOver}
        onMouseLeave={() => setHoverComponentId(undefined)}
        onClickCapture={handleClickCapture}
      >
        {componentTree}

        {/* Hover Mask */}
        {hoverComponentId &&
          hoverComponentId !== curComponentId &&
          hoverComponentId !== 1 && (
            <RendererHoverMask
              portalWrapperClassName="portal-wrapper"
              containerClassName="simulator-container"
              componentId={hoverComponentId}
            />
          )}

        {/* Selected Mask */}
        {curComponentId && (
          <RendererSelectedMask
            portalWrapperClassName="portal-wrapper"
            containerClassName="simulator-container"
            componentId={curComponentId}
          />
        )}

        <div className="portal-wrapper"></div>
      </div>
    </div>
  );
}
