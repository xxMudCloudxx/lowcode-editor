/**
 * @file Page/index.tsx
 * @description 纯净的页面根容器组件
 *
 * Page 是组件树的根节点，作为所有其他组件的容器。
 * 它会填满整个 Simulator Container。
 */
import { forwardRef } from "react";
import type { MaterialProps } from "../interface";

export interface PageProps extends MaterialProps {}

const Page = forwardRef<HTMLDivElement, PageProps>(
  (
    { children, style, className, "data-component-id": id, ...restProps },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-component-id={id}
        style={{
          width: "100%",
          minHeight: "100%",
          padding: 20,
          boxSizing: "border-box",
          backgroundColor: "#fff",
          ...style,
        }}
        className={className}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

Page.displayName = "Page";

export default Page;
