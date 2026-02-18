/**
 * @file /src/editor/components/common/BorderSideGlyph/index.tsx
 * @description
 * 一个用于渲染边框方向示意图标（SVG Glyph）的纯展示组件。
 * 它可以根据传入的 `type` 动态高亮上、下、左、右或全部边框，
 * 通常用在边框设置器中，为用户提供直观的视觉引导。
 * @module Components/Common/BorderBlockGlyph
 */
import React from "react";

type BorderType = "top" | "right" | "bottom" | "left" | "all";

interface BorderBlockGlyphProps {
  type: BorderType;
  active?: boolean; // 选中：边为蓝；未选中：边为黑
  accent?: string; // 选中时高亮色（蓝）
  edgeColor?: string; // 未选中时的边颜色（黑）
  hintColor?: string; // 背景虚线颜色
  strokeWidth?: number; // all 圈边的描边粗细
  radius?: number; // 圆角
  bar?: number; // 单侧条的厚度（px）
  dashed?: boolean; // 是否显示背景虚线（true=显示）
  className?: string;
}

export const BorderBlockGlyph: React.FC<BorderBlockGlyphProps> = ({
  type,
  active = false,
  accent = "#3b82f6", // blue-500
  edgeColor = "RGB(102,102,102)", // 接近黑（gray-900）
  hintColor = "RGB(152,152,152)", // 虚线颜色（slate-300）
  strokeWidth = 1,
  radius = 2,
  bar = 3,
  dashed = true,
  className,
}) => {
  const x = 4,
    y = 4,
    w = 16,
    h = 16;
  const color = active ? accent : edgeColor;

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      fill="none"
      shapeRendering="geometricPrecision"
    >
      {/* 背景虚线提示框（始终存在） */}
      {dashed && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={radius}
          stroke={hintColor}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}

      {/* 指定边（或整圈）——未选中黑色，选中蓝色 */}
      {type === "all" ? (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={radius}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ) : (
        <>
          {type === "top" && (
            <rect
              x={x}
              y={y}
              width={w}
              height={bar}
              rx={Math.min(radius, bar / 2)}
              fill={color}
            />
          )}
          {type === "right" && (
            <rect
              x={x + w - bar}
              y={y}
              width={bar}
              height={h}
              rx={Math.min(radius, bar / 2)}
              fill={color}
            />
          )}
          {type === "bottom" && (
            <rect
              x={x}
              y={y + h - bar}
              width={w}
              height={bar}
              rx={Math.min(radius, bar / 2)}
              fill={color}
            />
          )}
          {type === "left" && (
            <rect
              x={x}
              y={y}
              width={bar}
              height={h}
              rx={Math.min(radius, bar / 2)}
              fill={color}
            />
          )}
        </>
      )}
    </svg>
  );
};
