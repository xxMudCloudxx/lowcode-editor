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

  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  // 当目标组件 ID 变化时，重新计算位置
  // 注意：不依赖 components 对象，因为 props/desc 变化不应触发位置更新
  useEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId]);

  /**
   * @description 核心函数：计算并更新遮罩层的位置和大小。
   *
   * 重要：当画布被 CSS transform: scale() 缩放时，
   * getBoundingClientRect() 返回的是缩放后的视觉像素值。
   * 但遮罩层在 Portal 中渲染，不受 scale 影响，
   * 所以需要除以 scale 来还原逻辑坐标。
   */
  function updatePosition() {
    if (!componentId) return;

    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    // 查找目标组件对应的 DOM 节点
    const node = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!node) return;

    // 获取当前缩放比例（从 CSS 变量中读取，由 useSimulatorStyles 设置）
    const scale = parseFloat(
      getComputedStyle(container).getPropertyValue("--current-scale") || "1"
    );

    // getBoundingClientRect() 返回的是元素相对于浏览器视口的位置
    const { top, left, width, height } = node.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } =
      container.getBoundingClientRect();

    // 计算相对于容器的偏移（这些值是缩放后的），然后除以 scale 还原逻辑坐标
    const relativeTop = (top - containerTop) / scale + container.scrollTop;
    const relativeLeft = (left - containerLeft) / scale + container.scrollLeft;
    const logicalWidth = width / scale;
    const logicalHeight = height / scale;

    let labelTop = relativeTop;
    const labelLeft = relativeLeft + logicalWidth;
    if (labelTop <= 0) {
      labelTop += 20;
    }

    // 核心逻辑：将组件的"视口坐标"转换为"相对于滚动画布容器的坐标"。
    // 必须减去容器的视口偏移，并加上容器自身的滚动距离，
    // 这样遮罩层才能在画布滚动后依然正确定位。
    setPosition({
      top: relativeTop,
      left: relativeLeft,
      width: logicalWidth,
      height: logicalHeight,
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
