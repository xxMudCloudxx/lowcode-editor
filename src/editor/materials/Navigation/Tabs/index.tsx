/**
 * @file Tabs/index.tsx
 * @description 纯净的标签页组件（容器组件）
 *
 * Tabs 是父容器组件，接收 TabPane 作为子组件。
 * 类似 Table/TableColumn 的父子关系，从 children 中提取 TabPane 信息构建 items。
 */
import { forwardRef, Children, isValidElement, useMemo } from "react";
import { Tabs as AntdTabs, type TabsProps as AntdTabsProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface TabsProps
  extends MaterialProps,
    Omit<AntdTabsProps, "items" | keyof MaterialProps> {}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      children,
      style,
      className,
      type = "line",
      tabPosition = "top",
      centered,
      "data-component-id": id,
      ...restProps
    },
    ref
  ) => {
    // 将 TabPane children 转换为 Antd Tabs 的 items 配置
    const items = useMemo(() => {
      return Children.map(children, (child, index) => {
        if (!isValidElement(child)) return null;

        const childProps = child.props as Record<string, unknown>;
        const componentId = childProps["data-component-id"] as
          | string
          | number
          | undefined;
        const tabLabel = childProps.tab as string | undefined;

        return {
          key: componentId != null ? String(componentId) : `tab-${index}`,
          label: tabLabel || "标签项",
          // 将整个 child（DraggableNode 包裹的 TabPane）作为内容，使其可选中
          children: child,
        };
      })?.filter(Boolean);
    }, [children]);

    const hasChildren = items && items.length > 0;

    return (
      <div
        ref={ref}
        data-component-id={id}
        style={{
          minHeight: 100,
          ...style,
        }}
        className={className}
      >
        <AntdTabs
          type={type}
          tabPosition={tabPosition}
          centered={centered}
          items={items}
          {...restProps}
        />

        {!hasChildren && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 80,
              backgroundColor: "#fafafa",
              color: "#999",
            }}
          >
            请拖拽"标签项"组件到这里
          </div>
        )}
      </div>
    );
  }
);

Tabs.displayName = "Tabs";

export default Tabs;
