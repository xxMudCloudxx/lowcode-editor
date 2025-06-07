/**
 * @file /src/editor/components/EditArea/HoverMask/index.tsx
 * @description
 * 一个用于在编辑器画布中高亮“悬浮”组件的遮罩层。
 * 它会根据目标组件的位置和大小动态定位，并使用 React Portal 将自身渲染到顶层 DOM，
 * 以避免被父组件的 CSS `overflow` 或 `z-index` 限制。
 * @module Components/EditArea/HoverMask
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getComponentById,
  useComponetsStore,
} from "../../../stores/components";

interface HoverMaskProps {
  portalWrapperClassName: string; // Portal 的目标容器 DOM 节点的类名
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
  const { components } = useComponetsStore();

  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  // 当目标组件 ID 变化时，重新计算位置
  useEffect(() => {
    updatePosition();
  }, [componentId]);

  // 当整个组件树发生变化时，也可能需要更新位置（例如组件被移动或删除）
  useEffect(() => {
    updatePosition();
  }, [components]);

  /**
   * @description 核心函数：计算并更新遮罩层的位置和大小。
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

    let labelTop = top - containerTop + container.scrollTop;
    const labelLeft = left - containerLeft + width;
    if (labelTop <= 0) {
      labelTop += 20;
    }

    // 核心逻辑：将组件的“视口坐标”转换为“相对于滚动画布容器的坐标”。
    // 必须减去容器的视口偏移，并加上容器自身的滚动距离，
    // 这样遮罩层才能在画布滚动后依然正确定位。
    setPosition({
      top: top - containerTop + container.scrollTop,
      left: left - containerLeft + container.scrollLeft,
      width,
      height,
      labelLeft,
      labelTop,
    });
  }

  // 使用 useMemo 缓存 Portal 目标节点的查询，避免重复 DOM 操作
  const el = useMemo(() => {
    return document.querySelector(`.${portalWrapperClassName}`)!;
  }, []);

  // 获取当前组件的元数据，用于显示描述信息
  const curComponent = useMemo(() => {
    return getComponentById(componentId, components);
  }, [componentId]);

  // 如果目标节点不存在，不渲染任何东西
  if (!portalEl) return null;

  // 使用 React Portal 将遮罩层渲染到指定的 portalWrapper 节点中
  return createPortal(
    <>
      {/* 遮罩层本身 */}
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          backgroundColor: "rgba(0, 0, 255, 0.05)",
          border: "1px dashed blue",
          pointerEvents: "none", // 允许鼠标事件穿透遮罩层
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
