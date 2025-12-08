/**
 * @file Grid/index.tsx
 * @description 纯净的 Grid (Row) 物料组件
 *
 * 使用 Antd 的 Row 组件实现栅格布局
 * 必须使用 forwardRef 支持 ref 转发
 *
 * 注意：编辑器特有的样式通过 CSS 作用域注入，组件本身保持纯净
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Row, type RowProps } from "antd";

export interface GridProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
    Pick<RowProps, "gutter" | "justify" | "align" | "wrap"> {
  /** 子组件（GridColumn） */
  children?: ReactNode;
}

/**
 * Grid 物料组件
 * 基于 Antd Row，用于创建响应式栅格布局
 */
const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    { children, style, className, gutter, justify, align, wrap, ...restProps },
    ref
  ) => {
    return (
      <Row
        ref={ref}
        style={style}
        className={className}
        gutter={gutter}
        justify={justify}
        align={align}
        wrap={wrap}
        {...restProps}
      >
        {children}
      </Row>
    );
  }
);

Grid.displayName = "Grid";

export default Grid;
