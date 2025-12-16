/**
 * @file useSimulatorStyles.ts
 * @description
 * 计算画布容器样式的 Hook。
 *
 * 架构说明：
 * - wrapperStyle: 占位层，精确宽度 = canvasWidth * localScale，用于撑开滚动条
 * - simulatorStyle: 实际画布层，应用缩放（transform: scale(localScale)）
 * - workspaceStyle: 外层工作区，居中显示 wrapper
 */

import { useMemo, type CSSProperties } from "react";
import { useUIStore } from "../../../stores/uiStore";
import type { ContainerSize } from "./useContainerResize";

export interface SimulatorStyles {
  /** 占位层样式：撑开滚动条 */
  wrapperStyle: CSSProperties;
  /** 模拟器样式：应用缩放 */
  simulatorStyle: CSSProperties;
  /** 工作区背景样式 */
  workspaceStyle: CSSProperties;
}

/**
 * 计算画布容器样式
 * @param localScale 当前本地缩放比例
 * @param containerSize 容器尺寸（用于动态 transform-origin）
 * @returns { wrapperStyle, simulatorStyle, workspaceStyle }
 */
export function useSimulatorStyles(
  localScale: number,
  containerSize: ContainerSize
): SimulatorStyles {
  const { canvasSize } = useUIStore();

  // 计算画布宽度
  const canvasWidth = useMemo(() => {
    return typeof canvasSize.width === "number" ? canvasSize.width : 1440;
  }, [canvasSize.width]);

  // 判断画布是否比容器宽（用于决定 transform-origin）
  const isCanvasWiderThanContainer = useMemo(() => {
    return canvasWidth * localScale > containerSize.width;
  }, [canvasWidth, localScale, containerSize.width]);

  /**
   * 占位层样式（canvas-wrapper）
   * 关键作用：撑开滚动区域
   * 宽度精确 = canvasWidth * scale，用于触发滚动条
   */
  const wrapperStyle = useMemo<CSSProperties>(() => {
    return {
      // 精确宽度，用于撑开滚动条
      width: canvasWidth * localScale,
      // 高度占满
      height: "100%",
      // 画布小于容器时居中显示，大于容器时左对齐（确保滚动条从左开始）
      margin: isCanvasWiderThanContainer ? "0" : "0 auto",
    };
  }, [canvasWidth, localScale, isCanvasWiderThanContainer]);

  /**
   * 模拟器容器样式（simulator-container）
   * 应用实际的缩放变换
   */
  const simulatorStyle = useMemo<CSSProperties>(() => {
    const isDesktop = canvasSize.mode === "desktop";

    return {
      // 固定宽度，不能用 flex: 1（会与 transform 冲突导致尺寸计算错误）
      width: canvasWidth,
      // 高度占满（使用 100% 相对于 wrapper）
      height: "100%",
      // 防止被 flex 压缩
      flexShrink: 0,
      position: "relative",
      // 隔离溢出内容
      overflow: isDesktop ? "visible" : "hidden",
      // 视觉样式
      backgroundColor: "#fff",
      boxShadow: isDesktop ? "none" : "0 4px 24px rgba(0, 0, 0, 0.12)",
      borderRadius: isDesktop ? 0 : 8,
      transform: `scale(${localScale})`,
      // 始终从左上角缩放，由 wrapper 的 margin: auto 控制是否居中
      transformOrigin: "0 0",
      // 不对 transform 使用 transition，避免与 mask 位置计算产生时序冲突
      transition: "box-shadow 0.3s ease, border-radius 0.3s ease",
      "--current-scale": localScale,
    } as CSSProperties;
  }, [canvasSize, localScale, canvasWidth]);

  /**
   * 工作台背景样式
   * 使用 flex 居中显示 wrapper
   */
  const workspaceStyle = useMemo<CSSProperties>(() => {
    return {
      overflow: "auto",
      height: "100%",
      width: "100%",
      background: `
        radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
        radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
        linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
      `,
      backgroundSize: "50px 50px, 100px 100px, 100% 100%",
    };
  }, []);

  return { wrapperStyle, simulatorStyle, workspaceStyle };
}
