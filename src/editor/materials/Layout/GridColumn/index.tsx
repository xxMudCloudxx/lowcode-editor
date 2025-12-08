/**
 * @file GridColumn/index.tsx
 * @description 纯净的 GridColumn (Col) 物料组件
 *
 * 使用 Antd 的 Col 组件实现栅格列
 * 必须使用 forwardRef 支持 ref 转发
 *
 * 注意：编辑器特有的样式通过 CSS 作用域注入，组件本身保持纯净
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Col, type ColProps } from "antd";

export interface GridColumnProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
    Pick<ColProps, "span" | "offset" | "order" | "pull" | "push"> {
  /** 子组件 */
  children?: ReactNode;
}

/**
 * GridColumn 物料组件
 * 基于 Antd Col，用于栅格布局的列
 */
const GridColumn = forwardRef<HTMLDivElement, GridColumnProps>(
  (
    {
      children,
      style,
      className,
      span,
      offset,
      order,
      pull,
      push,
      ...restProps
    },
    ref
  ) => {
    return (
      <Col
        ref={ref}
        style={style}
        className={className}
        span={span}
        offset={offset}
        order={order}
        pull={pull}
        push={push}
        {...restProps}
      >
        {children}
      </Col>
    );
  }
);

GridColumn.displayName = "GridColumn";

export default GridColumn;
