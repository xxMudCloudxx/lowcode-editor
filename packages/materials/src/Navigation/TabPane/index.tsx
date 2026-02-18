/**
 * @file TabPane/index.tsx
 * @description 纯净的标签项组件（容器组件）
 *
 * TabPane 是 Tabs 的子组件，本身是一个容器，可以放置任意内容。
 * 它的 `tab` 属性用于 Tabs 的标签名显示。
 */
import { forwardRef } from "react";
import React from "react";
import type { MaterialProps } from "../../interface";

export interface TabPaneProps extends MaterialProps {
  /** 标签栏显示的标题 */
  tab?: string;
}

const TabPane = forwardRef<HTMLDivElement, TabPaneProps>(
  ({ style, className, children, tab, ...restProps }, ref) => {
    // 检查是否有子组件
    const hasChildren = React.Children.count(children) > 0;

    return (
      <div
        ref={ref}
        style={{
          minHeight: 100,
          padding: 16,
          ...style,
        }}
        className={className}
        {...restProps}
      >
        {hasChildren ? (
          children
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: 80,
              color: "#999",
              backgroundColor: "#fafafa",
            }}
          >
            拖拽组件到这里
          </div>
        )}
      </div>
    );
  }
);

TabPane.displayName = "TabPane";

export default TabPane;
