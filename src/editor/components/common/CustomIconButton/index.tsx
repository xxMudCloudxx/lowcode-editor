/**
 * @file /src/editor/components/common/CustomIconButton/index.tsx
 * @description
 * 一个高度可定制的、纯图标按钮组件。
 * 它封装了激活状态、尺寸控制、最小点击区域和基础样式，
 * 旨在提供统一、灵活的图标按钮解决方案。
 * @module Components/Common/CustomIconButton
 */
import React, { forwardRef, type ReactNode } from "react";
import clsx from "clsx";

export interface CustomIconButtonProps
  extends React.ComponentPropsWithoutRef<"button"> {
  icon: ReactNode;
  isActive?: boolean;
  /** 影响 1em/当前字体大小的图标（如大多数组件库图标），如 20 | '1.25rem' */
  size?: number | string;
  /** 可选：保证最小命中区域（如 32 / 40），不影响自适应内容 */
  minSize?: number;
  /** 可选：内边距，默认 0（如 '0.25rem' 或 4） */
  padding?: number | string;
}

export const CustomIconButton = forwardRef<
  HTMLButtonElement,
  CustomIconButtonProps
>((props, ref) => {
  const {
    icon,
    isActive = false,
    className,
    size,
    minSize,
    padding,
    style,
    ...rest
  } = props;

  // 通过 font-size 驱动 em 图标；保证最小命中区；可选 padding
  const computedStyle: React.CSSProperties = {
    ...(size != null
      ? { fontSize: typeof size === "number" ? `${size}px` : size }
      : null),
    ...(minSize != null ? { minWidth: minSize, minHeight: minSize } : null),
    ...(padding != null
      ? { padding: typeof padding === "number" ? `${padding}px` : padding }
      : { padding: 0 }),
    ...style,
  };

  return (
    <button
      ref={ref}
      className={clsx(
        // 关键：不设固定宽高；用 inline-flex 让按钮尺寸跟随内容
        "inline-flex items-center justify-center rounded transition-colors duration-150",
        // 移除行高对高度的影响，避免出现额外空白
        "leading-none",
        // 去除 SVG 基线缝隙，让按钮紧贴图标尺寸
        "[&>svg]:block",
        // 状态样式
        {
          "bg-blue-500 text-white hover:bg-blue-600": isActive,
          "bg-transparent text-gray-600 hover:bg-gray-200": !isActive,
        },
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
        className
      )}
      style={computedStyle}
      {...rest}
      // 无文本的纯图标按钮，建议传 aria-label
      // aria-label={props["aria-label"] ?? "icon button"}
    >
      {icon}
    </button>
  );
});

CustomIconButton.displayName = "CustomIconButton";
export default CustomIconButton;
