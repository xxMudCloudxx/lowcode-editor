/**
 * @file List/index.tsx
 * @description 纯净的 List 物料组件（容器组件）
 */
import { forwardRef } from "react";
import { List as AntdList, type ListProps as AntdListProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface ListProps
  extends MaterialProps,
    Omit<AntdListProps<any>, "dataSource" | "renderItem"> {}

const List = forwardRef<HTMLDivElement, ListProps>(
  (
    {
      children,
      style,
      className,
      bordered,
      header,
      footer,
      size,
      ...restProps
    },
    ref
  ) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <AntdList
          bordered={bordered}
          header={header}
          footer={footer}
          size={size}
        >
          {children}
        </AntdList>
      </div>
    );
  }
);

List.displayName = "List";

export default List;
