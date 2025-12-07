/**
 * @file Space/index.tsx
 * @description 纯净的 Space 物料组件
 *
 * 使用 Antd 的 Space 组件实现间距布局
 * 必须使用 forwardRef 支持 ref 转发
 *
 * 注意：编辑器特有的样式通过 CSS 作用域注入，组件本身保持纯净
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Space as AntdSpace, type SpaceProps as AntdSpaceProps } from "antd";

export interface SpaceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
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
      <div
        ref={ref}
        style={{ display: "inline-flex", ...style }}
        className={className}
        {...restProps}
      >
        <AntdSpace direction={direction} size={size} align={align} wrap={wrap}>
          {children}
        </AntdSpace>
      </div>
    );
  }
);

Space.displayName = "Space";

export default Space;
