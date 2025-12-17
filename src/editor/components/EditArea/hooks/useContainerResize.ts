/**
 * @file useContainerResize.ts
 * @description
 * 监听容器尺寸变化的 Hook。
 * 使用 ResizeObserver 监听容器尺寸，支持 Allotment 拖动等场景。
 */

import { useState, useLayoutEffect, type RefObject } from "react";

export interface ContainerSize {
  width: number;
  height: number;
}

/**
 * 监听容器尺寸变化
 * @param containerRef 容器元素的 ref
 * @returns 容器尺寸 { width, height }
 */
export function useContainerResize(
  containerRef: RefObject<HTMLDivElement | null>
): ContainerSize {
  const [containerSize, setContainerSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // 同步初始化：立即获取当前尺寸，避免首次渲染时 containerSize 为 0
    const { width, height } = containerRef.current.getBoundingClientRect();
    setContainerSize({ width, height });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // 使用 requestAnimationFrame 防止 Resize Loop 报错
        requestAnimationFrame(() => {
          setContainerSize({ width, height });
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return containerSize;
}
