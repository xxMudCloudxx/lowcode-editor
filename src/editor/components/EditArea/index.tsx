/**
 * @file /src/editor/components/EditArea/index.tsx
 * @description
 * 编辑器的主画布区域。
 * 负责：
 * - 基于 `components` store 中的范式化组件 Map 递归渲染组件树
 * - 通过事件委托（捕获阶段）处理画布的鼠标悬浮和点击事件
 * - 条件性地渲染 HoverMask / SelectedMask 来提供视觉反馈
 *
 * v3 架构变更：
 * - 新增 Simulator Container 隔离画布尺寸
 * - 解决组件 100% 宽高参照视口而非画布的问题
 * - 支持切换 desktop/mobile 画布模式
 *
 * @module Components/EditArea
 */

import React, {
  Suspense,
  useMemo,
  useState,
  useCallback,
  type MouseEventHandler,
  type CSSProperties,
} from "react";
import { ConfigProvider } from "antd";
import { useComponentsStore } from "../../stores/components";
import { useComponentConfigStore } from "../../stores/component-config";
import { useUIStore } from "../../stores/uiStore";
import { useCollaborationStore } from "../../stores/collaborationStore";
import HoverMask from "./HoverMask";
import SelectedMask from "./SelectedMask";
import LoadingPlaceholder from "../common/LoadingPlaceholder";
import { DraggableNode } from "./DraggableNode";
// isProtocolConfig remove

export function EditArea() {
  const { components, rootId } = useComponentsStore();
  const { curComponentId, setCurComponentId, canvasSize } = useUIStore();
  const { componentConfig } = useComponentConfigStore();
  const { editorMode, isConnected, connectionError } = useCollaborationStore();

  // 联机模式下断开连接时禁用编辑
  const isDisabled = editorMode === "live" && !isConnected;

  // 使用 state 追踪当前鼠标悬浮在其上的组件 ID
  const [hoverComponentId, setHoverComponentId] = useState<number>();

  /**
   * 计算 Simulator Container 的样式
   * 根据 canvasSize 模式决定固定尺寸或自适应
   */
  const simulatorStyle = useMemo<CSSProperties>(() => {
    const isDesktop = canvasSize.mode === "desktop";

    return {
      width: isDesktop ? "100%" : canvasSize.width,
      height: isDesktop ? "100%" : canvasSize.height,
      minHeight: isDesktop ? "100%" : undefined,
      // 建立新的定位上下文（包含块）
      position: "relative",
      // 隔离溢出内容
      overflow: isDesktop ? "visible" : "hidden",
      // 视觉样式
      backgroundColor: "#fff",
      boxShadow: isDesktop ? "none" : "0 4px 24px rgba(0, 0, 0, 0.12)",
      borderRadius: isDesktop ? 0 : 8,
      // 过渡动画：只对视觉属性进行过渡，避免 width/height 过渡导致的奇怪效果
      transition: "box-shadow 0.3s ease, border-radius 0.3s ease",
    };
  }, [canvasSize]);

  /**
   * 工作台样式：根据画布模式调整布局
   */
  const workspaceStyle = useMemo<CSSProperties>(() => {
    const isDesktop = canvasSize.mode === "desktop";

    return {
      display: "flex",
      justifyContent: isDesktop ? "stretch" : "center",
      alignItems: isDesktop ? "stretch" : "flex-start",
      padding: isDesktop ? 0 : 24,
      // 背景
      background: `
        radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
        radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
        linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
      `,
      backgroundSize: "50px 50px, 100px 100px, 100% 100%",
    };
  }, [canvasSize]);

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
      return config.editor.isContainer ?? false;
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

      // 获取要渲染的组件
      const ComponentToRender = config.component;

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
      className="h-full edit-area overflow-auto relative"
      style={workspaceStyle}
    >
      {/* ========== Simulator Container ========== */}
      {/* 
        这是"模拟器"容器，建立新的包含块（Containing Block）
        - 所有子组件的 width: 100% 将相对于此容器计算
        - position: absolute 的组件将相对于此容器定位
        - overflow: hidden 防止内容溢出
      */}
      <div
        className="simulator-container"
        style={simulatorStyle}
        onMouseOver={isDisabled ? undefined : handleMouseOver}
        onMouseLeave={() => {
          setHoverComponentId(undefined);
        }}
        // 关键：使用捕获阶段处理点击事件，确保编辑器选中逻辑最高优先级
        onClickCapture={isDisabled ? undefined : handleClickCapture}
      >
        {/* 重置 Antd 主题为默认，让画布中的组件使用默认颜色 */}
        <ConfigProvider theme={{ inherit: false }}>
          {componentTree}
        </ConfigProvider>

        {/* 当有悬浮组件且该组件不是当前选中的组件时，显示悬浮遮罩 */}
        {!isDisabled &&
          hoverComponentId &&
          hoverComponentId !== curComponentId &&
          hoverComponentId !== 1 && (
            <HoverMask
              portalWrapperClassName="portal-wrapper"
              containerClassName="simulator-container"
              componentId={hoverComponentId}
            />
          )}

        {/* 当有选中组件时，显示选中遮罩 */}
        {!isDisabled && curComponentId && (
          <SelectedMask
            portalWrapperClassName="portal-wrapper"
            containerClassName="simulator-container"
            componentId={curComponentId}
          />
        )}

        {/* 断开连接时显示禁用遮罩 */}
        {isDisabled && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px 32px",
                borderRadius: 12,
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                连接已断开
              </div>
              <div style={{ color: "#666", marginBottom: 16 }}>
                {connectionError || "正在尝试重新连接..."}
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>
                编辑功能已暂时禁用
              </div>
            </div>
          </div>
        )}

        {/* 这个 div 是给 HoverMask 和 SelectedMask 的 React Portal 准备的目标挂载点 */}
        <div className="portal-wrapper"></div>
      </div>
    </div>
  );
}
