/**
 * @file Breadcrumb/index.tsx
 * @description 纯净的面包屑导航组件
 */
import { forwardRef } from "react";
import {
  Breadcrumb as AntdBreadcrumb,
  type BreadcrumbProps as AntdBreadcrumbProps,
} from "antd";
import type { MaterialProps } from "../../interface";

export interface BreadcrumbProps extends MaterialProps, AntdBreadcrumbProps {}

const Breadcrumb = forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ style, className, items, separator, ...restProps }, ref) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <AntdBreadcrumb items={items} separator={separator} />
      </div>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";

export default Breadcrumb;
