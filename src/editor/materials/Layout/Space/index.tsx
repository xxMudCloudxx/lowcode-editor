/**
 * @file Space/index.tsx
 * @description 纯净的 Space 物料组件
 *
 * 使用 Antd 的 Space 组件实现间距布局
 *
 * 设计说明：
 * - 需要外层 wrapper 来接收 ref 和 data-* 属性
 * - AntdSpace 本身不透传 data-* 属性到 DOM
 * - wrapper 使用 display:contents 尽量减少布局影响
 *
 * 注意：编辑器特有的样式通过 CSS 作用域注入，组件本身保持纯净
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Space as AntdSpace, type SpaceProps as AntdSpaceProps } from "antd";

export interface SpaceProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<AntdSpaceProps, "direction" | "size" | "align" | "wrap"> {
  /** 子组件 */
  children?: ReactNode;
}

/**
 * Space 物料组件
 * 基于 Antd Space，用于设置子元素之间的间距
 */
const Space = forwardRef<HTMLDivElement, SpaceProps>(
  (
    { children, style, className, direction, size, align, wrap, ...restProps },
    ref
  ) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <AntdSpace direction={direction} size={size} align={align} wrap={wrap}>
          {children}
        </AntdSpace>
      </div>
    );
  }
);

Space.displayName = "Space";

export default Space;
