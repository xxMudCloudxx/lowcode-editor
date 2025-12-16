/**
 * @file /src/editor/components/EditArea/CollaboratorMask/index.tsx
 * @description
 * 渲染其他协作者选中的组件的高亮遮罩。
 * 类似于 SelectedMask，但使用协作者的专属颜色，
 * 并显示用户名标签而非操作工具栏。
 *
 * @module Components/EditArea/CollaboratorMask
 */

import { useEffect, useLayoutEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import type { Collaborator } from "../../../stores/collaborationStore";
import { useUIStore } from "../../../stores/uiStore";

interface CollaboratorMaskProps {
  collaborator: Collaborator;
  portalWrapperClassName: string;
  containerClassName: string;
}

/**
 * 协作者选中遮罩组件
 * 显示其他用户当前选中的组件高亮
 */
function CollaboratorMaskInner({
  collaborator,
  portalWrapperClassName,
  containerClassName,
}: CollaboratorMaskProps) {
  const { selectedComponentId, userName, color } = collaborator;

  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const { localScale } = useUIStore();
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  // 获取 Portal 容器
  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  // 监听滚动和窗口大小变化
  // 注意：必须包含 localScale 依赖，否则事件处理器会捕获旧的 scale 值
  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const handleUpdate = () => {
      updatePosition();
    };

    container.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate);

    return () => {
      container.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerClassName, selectedComponentId, localScale]);

  // 计算位置（当选中组件或缩放比例变化时）
  useLayoutEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponentId, localScale]);

  /**
   * 计算并更新遮罩层的位置和大小
   * 注意：getBoundingClientRect() 返回的是缩放后的视觉尺寸，
   * 但 mask 是在 simulator 内部渲染的（也会被缩放），
   * 所以需要将尺寸除以 scale 来得到正确的 CSS 定位值。
   */
  function updatePosition() {
    if (!selectedComponentId) return;

    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const node = document.querySelector(
      `[data-component-id="${selectedComponentId}"]`
    );
    if (!node) {
      // 组件可能已删除，重置位置
      setPosition({ left: 0, top: 0, width: 0, height: 0 });
      return;
    }

    const { top, left, width, height } = node.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } =
      container.getBoundingClientRect();

    // 将缩放后的视觉尺寸转换为未缩放的 CSS 值
    const unscaledWidth = width / localScale;
    const unscaledHeight = height / localScale;
    const unscaledTop = (top - containerTop) / localScale + container.scrollTop;
    const unscaledLeft =
      (left - containerLeft) / localScale + container.scrollLeft;

    setPosition({
      top: unscaledTop,
      left: unscaledLeft,
      width: unscaledWidth,
      height: unscaledHeight,
    });
  }

  // 如果没有选中组件，不渲染
  if (!selectedComponentId || !portalEl) {
    return null;
  }

  // 如果位置无效，不渲染
  if (position.width === 0 || position.height === 0) {
    return null;
  }

  // 使用颜色生成半透明版本
  const backgroundColor = `${color}15`; // 约 8% 透明度
  const borderColor = color;

  return createPortal(
    <>
      {/* 遮罩层 */}
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          width: position.width,
          height: position.height,
          backgroundColor,
          border: `2px solid ${borderColor}`,
          pointerEvents: "none",
          zIndex: 11,
          borderRadius: 4,
          boxSizing: "border-box",
          transition: "all 0.15s ease-out",
        }}
      />

      {/* 用户名标签 */}
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          transform: "translate(0, -100%)",
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: "4px 4px 0 0",
          backgroundColor: borderColor,
          color: "#fff",
          whiteSpace: "nowrap",
          zIndex: 11,
          pointerEvents: "none",
        }}
      >
        {userName}
      </div>
    </>,
    portalEl
  );
}

export const CollaboratorMask = memo(CollaboratorMaskInner);
export default CollaboratorMask;
