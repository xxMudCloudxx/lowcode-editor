/**
 * @file Tooltip/index.tsx
 * @description 纯净的 Tooltip 物料组件（容器组件）
 */
import { forwardRef, Children } from "react";
import {
  Tooltip as AntdTooltip,
  type TooltipProps as AntdTooltipProps,
} from "antd";
import type { MaterialProps } from "../../interface";

export interface TooltipProps
  extends MaterialProps,
    Omit<AntdTooltipProps, "children"> {}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, style, className, title, placement, ...restProps }, ref) => {
    const hasChildren = Children.count(children) > 0;

    return (
      <div
        ref={ref}
        style={{ display: "inline-block", ...style }}
        className={className}
      >
        <AntdTooltip title={title} placement={placement} {...restProps}>
          {hasChildren ? (
            children
          ) : (
            <span
              style={{
                padding: "8px 16px",
                border: "1px dashed #d9d9d9",
                display: "inline-block",
                color: "var(--color-neutral-400)",
                cursor: "pointer",
              }}
            >
              悬浮提示区域
            </span>
          )}
        </AntdTooltip>
      </div>
    );
  }
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
