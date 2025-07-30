// src/editor/materials/Navigation/Tabs/prod.tsx
import React, { useMemo } from "react";
import { Tabs as AntdTabs } from "antd";
import type { CommonComponentProps } from "../../../interface";

const TabsProd = ({
  id,
  name,
  styles,
  isSelected,
  children,
  // 剩余的属性收集到 rest 中
  ...rest
}: CommonComponentProps) => {
  // 核心转换逻辑
  const items = useMemo(() => {
    return React.Children.map(children, (child: any) => {
      if (!child) return null;
      const tabPaneProps = child.props;
      return {
        key: String(tabPaneProps.id),
        label: tabPaneProps.tab || "标签项",
        children: child, // 直接将 TabPane 的 prod 版本作为内容
      };
    })?.filter(Boolean);
  }, [children]);

  return <AntdTabs style={styles} id={String(id)} {...rest} items={items} />;
};

export default TabsProd;
