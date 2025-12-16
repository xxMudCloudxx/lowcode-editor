/**
 * @file /src/editor/components/EditArea/HoverMask/index.tsx
 * @description
 * 在编辑器画布中高亮“悬浮”组件的遮罩层。
 * 通过 React Portal 渲染，避免被父组件的 overflow / z-index 限制。
 * @module Components/EditArea/HoverMask
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getComponentById,
  useComponentsStore,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";

interface HoverMaskProps {
  portalWrapperClassName: string; // Portal 目标 DOM 节点的类名
  containerClassName: string; // 画布容器的类名，用于计算相对位置
  componentId: number; // 要高亮的目标组件 ID
}

function HoverMask({
  containerClassName,
  componentId,
  portalWrapperClassName,
}: HoverMaskProps) {
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
  });
  const { components } = useComponentsStore();
  const { localScale } = useUIStore();

  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  // 当目标组件 ID 或缩放比例变化时，重新计算位置
  useEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, localScale]);

  /**
   * @description 核心函数：计算并更新遮罩层的位置和大小。
   * 注意：getBoundingClientRect() 返回的是缩放后的视觉尺寸，
   * 但 mask 是在 simulator 内部渲染的（也会被缩放），
   * 所以需要将尺寸除以 scale 来得到正确的 CSS 定位值。
   */
  function updatePosition() {
    if (!componentId) return;

    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    // 查找目标组件对应的 DOM 节点
    const node = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!node) return;

    // getBoundingClientRect() 返回的是元素相对于浏览器视口的位置
    const { top, left, width, height } = node.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } =
      container.getBoundingClientRect();

    // 将缩放后的视觉尺寸转换为未缩放的 CSS 值
    const unscaledWidth = width / localScale;
    const unscaledHeight = height / localScale;
    const unscaledTop = (top - containerTop) / localScale + container.scrollTop;
    const unscaledLeft =
      (left - containerLeft) / localScale + container.scrollLeft;

    let labelTop = unscaledTop;
    const labelLeft = unscaledLeft + unscaledWidth;
    if (labelTop <= 0) {
      labelTop += 20;
    }

    setPosition({
      top: unscaledTop,
      left: unscaledLeft,
      width: unscaledWidth,
      height: unscaledHeight,
      labelLeft,
      labelTop,
    });
  }

  // 获取当前组件的元数据，用于显示描述信息
  const curComponent = useMemo(() => {
    return getComponentById(componentId, components);
  }, [componentId, components]);

  // 如果目标节点不存在，不渲染任何东西
  if (!portalEl) return null;

  // 使用 React Portal 将遮罩层渲染到指定的 portalWrapper 节点中
  return createPortal(
    <>
      {/* 遮罩层本体 */}
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          backgroundColor: "rgba(0, 0, 255, 0.05)",
          border: "1px dashed blue",
          pointerEvents: "none",
          width: position.width,
          height: position.height,
          zIndex: 12,
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      />

      {/* 显示组件描述的标签 */}
      <div
        style={{
          position: "absolute",
          left: position.labelLeft,
          top: position.labelTop,
          fontSize: "14px",
          zIndex: 13,
          display: !position.width || position.width < 10 ? "none" : "inline",
          transform: "translate(-100%, -100%)",
        }}
      >
        <div
          style={{
            padding: "0 8px",
            backgroundColor: "blue",
            borderRadius: 4,
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {curComponent?.desc}
        </div>
      </div>
    </>,
    portalEl
  );
}

export default HoverMask;
