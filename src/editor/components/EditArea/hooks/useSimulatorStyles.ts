/**
 * @file useSimulatorStyles.ts
 * @description
 * 计算 Simulator 和 Workspace 样式的 Hook。
 * 根据画布模式和缩放比例动态生成样式。
 */

import { useMemo, type CSSProperties } from "react";
import { useUIStore } from "../../../stores/uiStore";

export interface SimulatorStyles {
  simulatorStyle: CSSProperties;
  workspaceStyle: CSSProperties;
}

/**
 * 计算 Simulator 和 Workspace 样式
 * @param scale 当前缩放比例
 * @returns { simulatorStyle, workspaceStyle }
 */
export function useSimulatorStyles(scale: number): SimulatorStyles {
  const { canvasSize } = useUIStore();

  /**
   * 计算 Simulator Container 的样式
   * 根据 canvasSize 模式决定固定尺寸或自适应
   */
  const simulatorStyle = useMemo<CSSProperties>(() => {
    const isDesktop = canvasSize.mode === "desktop";

    return {
      width: canvasSize.width,
      height: "100%",
      minHeight: "100%",
      // 建立新的定位上下文（包含块）
      position: "relative",
      // 隔离溢出内容
      overflow: isDesktop ? "visible" : "hidden",
      // 视觉样式
      backgroundColor: "#fff",
      boxShadow: isDesktop ? "none" : "0 4px 24px rgba(0, 0, 0, 0.12)",
      borderRadius: isDesktop ? 0 : 8,
      // 缩放变换
      transform: `scale(${scale})`,
      transformOrigin: "center top",
      // 过渡动画
      transition:
        "transform 0.1s ease-out, box-shadow 0.3s ease, border-radius 0.3s ease",
      // CSS 变量用于 Mask 边框补偿
      "--current-scale": scale,
    } as CSSProperties;
  }, [canvasSize, scale]);

  /**
   * 工作台样式：根据画布模式调整布局
   */
  const workspaceStyle = useMemo<CSSProperties>(() => {
    const isDesktop = canvasSize.mode === "desktop";

    return {
      display: "flex",
      justifyContent: isDesktop ? "stretch" : "center",
      alignItems: isDesktop ? "stretch" : "flex-start",
      // padding: isDesktop ? 0 : 12,
      // 背景
      background: `
        radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
        radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
        linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
      `,
      backgroundSize: "50px 50px, 100px 100px, 100% 100%",
    };
  }, [canvasSize]);

  return { simulatorStyle, workspaceStyle };
}
