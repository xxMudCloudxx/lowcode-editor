/**
 * @file useCanvasScale.ts
 * @description
 * 计算画布缩放比例的 Hook。
 * 根据容器尺寸和画布配置动态计算 scale 值。
 */

import { useMemo, useEffect } from "react";
import { useUIStore } from "../../../stores/uiStore";
import type { ContainerSize } from "./useContainerResize";

/**
 * 计算画布缩放比例
 * @param containerSize 容器尺寸
 * @returns 计算后的缩放比例
 */
export function useCanvasScale(containerSize: ContainerSize): number {
  const { canvasSize, setScale } = useUIStore();

  // 动态计算 scale（依赖 containerSize 和 canvasSize）
  const calculatedScale = useMemo(() => {
    // 如果是 100% 宽度的 Desktop 模式（初始化前），则不缩放
    if (canvasSize.mode === "desktop" && canvasSize.width === "100%") return 1;

    const canvasWidth =
      typeof canvasSize.width === "number" ? canvasSize.width : 1920;

    if (containerSize.width === 0) return 1;

    // 如果容器比画布宽，则不放大（保持 1:1），除非需要填充
    // 这里保持最大为 1，只做缩小适配
    if (containerSize.width >= canvasWidth) return 1;

    // Desktop 模式没有 Padding，直接计算
    // Mobile/Tablet 模式有 48px Padding
    // const padding = canvasSize.mode === "desktop" ? 0 : 48;
    // 我暂时把padding设置了0(useSimulatorStyles)
    const padding = 0;

    // 注意：如果 canvasWidth 很大，scale 会小于 1，从而实现"缩小查看"
    return Math.max(0, containerSize.width - padding) / canvasWidth;
  }, [containerSize.width, canvasSize]);

  // 同步 scale 到 uiStore（用于 Header 显示等）
  useEffect(() => {
    setScale(calculatedScale);
  }, [calculatedScale, setScale]);

  return calculatedScale;
}
