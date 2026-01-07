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
 * v4 重构：
 * - 逻辑抽离为独立 hooks，提高可维护性
 *
 * @module Components/EditArea
 */

import { useRef } from "react";
import { ConfigProvider } from "antd";
import { useUIStore } from "../../stores/uiStore";
import {
  useCollaborationStore,
  useCollaborators,
} from "../../stores/collaborationStore";
import HoverMask from "./HoverMask";
import SelectedMask from "./SelectedMask";
import CollaboratorCursor from "./CollaboratorCursor";
import CollaboratorMask from "./CollaboratorMask";
import ZoomControl from "./ZoomControl";
import { ErrorOverlay } from "./ErrorOverlay";

// 抽离的 hooks
import {
  useContainerResize,
  useSimulatorStyles,
  useCanvasInteraction,
  useRenderComponents,
} from "./hooks";

export function EditArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);

  // 从 store 获取必要状态
  const { curComponentId, localScale } = useUIStore();
  const { editorMode } = useCollaborationStore();
  const collaborators = useCollaborators();

  // ========== 使用抽离的 hooks ==========

  // 1. 监听容器尺寸变化
  const containerSize = useContainerResize(containerRef);

  // 注意：Desktop 模式下的 "100%" 现在由 useSimulatorStyles 直接处理为 CSS width: 100%
  // 不再需要转换为固定像素值

  // localScale 已从 useUIStore 中获取

  // 3. 计算样式（包含 wrapper 和 simulator）
  const { wrapperStyle, simulatorStyle, workspaceStyle } = useSimulatorStyles(
    localScale,
    containerSize
  );

  // 4. 画布交互事件处理
  const {
    hoverComponentId,
    handleMouseOver,
    handleMouseLeave,
    handleMouseMove,
    handleClickCapture,
    isDisabled,
  } = useCanvasInteraction(localScale);

  // 5. 组件树渲染
  const { componentTree } = useRenderComponents();

  return (
    <>
      {/* 错误遮罩 */}
      <ErrorOverlay />

      {/* 画布容器 */}
      <div
        ref={containerRef}
        className="h-full edit-area relative"
        style={workspaceStyle}
      >
        {/* Figma 风格悬浮缩放控件 */}
        <ZoomControl />
        {/* ========== Canvas Wrapper ========== */}
        {/* 
        占位层：用于撑开滚动条
        因为 transform: scale() 不会改变文档流尺寸
      */}
        <div className="canvas-wrapper" style={wrapperStyle}>
          {/* ========== Simulator Container ========== */}
          {/* 
          这是"模拟器"容器，建立新的包含块（Containing Block）
          - 所有子组件的 width: 100% 将相对于此容器计算
          - position: absolute 的组件将相对于此容器定位
        */}
          <div
            ref={simulatorRef}
            className="simulator-container"
            style={simulatorStyle}
            onMouseOver={isDisabled ? undefined : handleMouseOver}
            onMouseLeave={isDisabled ? undefined : handleMouseLeave}
            onMouseMove={isDisabled ? undefined : handleMouseMove}
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

            {/* ========== 协作者选中高亮 ========== */}
            {editorMode === "live" &&
              collaborators.map((collaborator) =>
                collaborator.selectedComponentId ? (
                  <CollaboratorMask
                    key={`mask-${collaborator.userId}`}
                    collaborator={collaborator}
                    portalWrapperClassName="portal-wrapper"
                    containerClassName="simulator-container"
                  />
                ) : null
              )}

            {/* ========== 协作者光标 ========== */}
            {editorMode === "live" &&
              collaborators.map((collaborator) =>
                collaborator.cursorX !== undefined &&
                collaborator.cursorY !== undefined ? (
                  <CollaboratorCursor
                    key={`cursor-${collaborator.userId}`}
                    collaborator={collaborator}
                  />
                ) : null
              )}

            {/* 这个 div 是给 HoverMask 和 SelectedMask 的 React Portal 准备的目标挂载点 */}
            <div className="portal-wrapper"></div>
          </div>
        </div>
      </div>
    </>
  );
}
