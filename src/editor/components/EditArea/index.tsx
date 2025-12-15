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

import { useRef, useEffect } from "react";
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

// 抽离的 hooks
import {
  useContainerResize,
  useCanvasScale,
  useSimulatorStyles,
  useCanvasInteraction,
  useRenderComponents,
} from "./hooks";

export function EditArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);

  // 从 store 获取必要状态
  const { curComponentId, canvasSize, setCanvasSize } = useUIStore();
  const { editorMode, connectionError } = useCollaborationStore();
  const collaborators = useCollaborators();

  // ========== 使用抽离的 hooks ==========

  // 1. 监听容器尺寸变化
  const containerSize = useContainerResize(containerRef);

  // 初始化 Desktop 模式下的画布宽度（将 100% 转换为具体像素值）
  // 核心逻辑：协同模式下，必须保证所有人的画布宽度一致（像素级对齐）
  useEffect(() => {
    if (
      canvasSize.mode === "desktop" &&
      containerSize.width > 0 &&
      simulatorRef.current
    ) {
      // 获取内容的最大占用宽度
      // scrollWidth 包含了溢出的内容宽度
      const contentWidth = simulatorRef.current.scrollWidth;

      // 取 容器宽度 和 内容宽度 的最大值，确保画布至少填满屏幕
      const targetWidth = Math.max(
        Math.floor(containerSize.width),
        contentWidth
      );

      // 只在宽度发生变化时更新，避免死循环
      // 对于 desktop 模式，我们期望宽度的变化能反应到 store 中（即使这会触发协同更新）
      // 但是在 协同模式 (live) 下，为了保证各端一致性，我们只要初始化一次后，就不再跟随 Resize 变化
      if (
        typeof canvasSize.width === "number" &&
        Math.abs(canvasSize.width - targetWidth) < 2
      ) {
        return;
      }

      // 如果是 live 模式且已经初始化过（width 是数字），则不再更新
      // 这实现了"冻结"画布宽度的效果
      if (editorMode === "live" && typeof canvasSize.width === "number") {
        return;
      }

      // 如果 canvasSize.width 是 "100%"，或者数值有较大差异（且非 live），则更新
      setCanvasSize({
        ...canvasSize,
        width: targetWidth,
      });
    }
  }, [canvasSize, containerSize.width, setCanvasSize, editorMode]);

  // 2. 计算画布缩放比例
  const scale = useCanvasScale(containerSize);

  // 3. 计算样式
  const { simulatorStyle, workspaceStyle } = useSimulatorStyles(scale);

  // 4. 画布交互事件处理
  const {
    hoverComponentId,
    handleMouseOver,
    handleMouseLeave,
    handleMouseMove,
    handleClickCapture,
    isDisabled,
  } = useCanvasInteraction(scale);

  // 5. 组件树渲染
  const { componentTree } = useRenderComponents();

  return (
    <div
      ref={containerRef}
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

        {/* 断开连接时显示禁用遮罩 */}
        {isDisabled && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.158)",
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
  );
}
