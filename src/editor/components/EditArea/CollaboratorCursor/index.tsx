/**
 * @file /src/editor/components/EditArea/CollaboratorCursor/index.tsx
 * @description
 * 渲染其他协作者的光标位置。
 * 显示彩色光标箭头和用户名标签。
 *
 * 坐标说明：
 * - 收到的 cursorX/cursorY 是逻辑坐标（未缩放状态下的位置）
 * - 由于光标渲染在 simulator-container 内，而 simulator 已经被 scale 缩放
 * - 所以光标使用逻辑坐标直接定位即可，会自动跟随画布缩放
 * - 但为了保持光标本身大小恒定，需要反向缩放 cursor 元素
 *
 * @module Components/EditArea/CollaboratorCursor
 */

import { type CSSProperties, memo } from "react";
import { useUIStore } from "../../../stores/uiStore";
import type { Collaborator } from "../../../stores/collaborationStore";

interface CollaboratorCursorProps {
  collaborator: Collaborator;
  containerRef?: React.RefObject<HTMLElement>;
}

/**
 * 协作者光标组件
 * 显示其他用户的实时光标位置
 */
function CollaboratorCursorInner({ collaborator }: CollaboratorCursorProps) {
  const { cursorX, cursorY, userName, color } = collaborator;
  const { localScale } = useUIStore();

  // 如果没有光标位置，或者位置无效（0,0 或负值表示隐藏），不渲染
  if (
    cursorX === undefined ||
    cursorY === undefined ||
    cursorX <= 0 ||
    cursorY <= 0
  ) {
    return null;
  }

  // 直接使用逻辑坐标定位
  // 因为光标在 simulator-container 内，会随画布一起缩放
  // 所以不需要额外乘以 localScale
  const cursorStyle: CSSProperties = {
    position: "absolute",
    left: cursorX,
    top: cursorY,
    pointerEvents: "none",
    zIndex: 1000,
    // 反向缩放光标本身，保持恒定大小
    // 因为光标在画布内部，会跟随画布一起缩放，所以需要反向缩放
    transform: `translate(-2px, -2px) scale(${1 / localScale})`,
    transformOrigin: "top left",
    transition: "left 0.1s ease-out, top 0.1s ease-out",
  };

  const labelStyle: CSSProperties = {
    position: "absolute",
    left: 14,
    top: -4,
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 6px",
    borderRadius: 4,
    backgroundColor: color,
    color: "#fff",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    userSelect: "none",
  };

  return (
    <div style={cursorStyle}>
      {/* 光标箭头 SVG */}
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <path d="M0 0L16 12L8 14L4 24L0 0Z" fill={color} />
        <path
          d="M0.5 1.5L14 11.5L7.5 13.2L4 22L0.5 1.5Z"
          fill={color}
          stroke="white"
          strokeWidth="0.5"
        />
      </svg>

      {/* 用户名标签 */}
      <span style={labelStyle}>{userName}</span>
    </div>
  );
}

export const CollaboratorCursor = memo(CollaboratorCursorInner);
export default CollaboratorCursor;
