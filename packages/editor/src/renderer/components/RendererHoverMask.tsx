/**
 * @file renderer/components/RendererHoverMask.tsx
 * @description
 * Iframe 内的 HoverMask。与原版完全一致，
 * 仅将数据源从 useComponentsStore 改为 useRendererStore。
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRendererStore } from "../stores/rendererStore";

interface RendererHoverMaskProps {
  portalWrapperClassName: string;
  containerClassName: string;
  componentId: number;
}

export function RendererHoverMask({
  containerClassName,
  componentId,
  portalWrapperClassName,
}: RendererHoverMaskProps) {
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
  });

  const { components } = useRendererStore();
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  useEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId]);

  function updatePosition() {
    if (!componentId) return;

    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const node = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!node) return;

    const { top, left, width, height } = node.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } =
      container.getBoundingClientRect();

    let labelTop = top - containerTop + container.scrollTop;
    const labelLeft = left - containerLeft + width;
    if (labelTop <= 0) {
      labelTop += 20;
    }

    setPosition({
      top: top - containerTop + container.scrollTop,
      left: left - containerLeft + container.scrollLeft,
      width,
      height,
      labelLeft,
      labelTop,
    });
  }

  const curComponent = useMemo(() => {
    return components[componentId] ?? null;
  }, [componentId, components]);

  if (!portalEl) return null;

  return createPortal(
    <>
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
    portalEl,
  );
}
