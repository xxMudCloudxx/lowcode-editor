/**
 * @file Pagination/index.tsx
 * @description 纯净的分页组件
 */
import { forwardRef } from "react";
import {
  Pagination as AntdPagination,
  type PaginationProps as AntdPaginationProps,
} from "antd";
import type { MaterialProps } from "../../interface";

export interface PaginationProps
  extends MaterialProps,
    Omit<AntdPaginationProps, keyof MaterialProps> {}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      style,
      className,
      current,
      pageSize,
      total,
      showSizeChanger,
      "data-component-id": id,
      children,
      ...restProps
    },
    ref
  ) => {
    return (
      <div ref={ref} data-component-id={id} style={style} className={className}>
        <AntdPagination
          current={current}
          pageSize={pageSize}
          total={total}
          showSizeChanger={showSizeChanger}
          {...restProps}
        />
      </div>
    );
  }
);

Pagination.displayName = "Pagination";

export default Pagination;
