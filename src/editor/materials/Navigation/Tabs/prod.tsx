// src/editor/materials/Navigation/Tabs/prod.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Tabs as AntdTabs } from "antd";
import type { CommonComponentProps } from "../../../interface";

export interface TabsRef {
  setActiveKey: (key: string) => void;
}

const TabsProd: React.ForwardRefRenderFunction<
  TabsRef,
  Omit<CommonComponentProps, "ref">
> = ({ id, styles, children, ...rest }, ref) => {
  const items = useMemo(() => {
    return React.Children.map(children, (child: any) => {
      if (!child) return null;
      //  在 dev 模式下，由于 Suspense 的包裹，需要多访问一层 children
      const tabPaneProps = child.props?.children?.props;
      return {
        key: String(tabPaneProps.id),
        label: tabPaneProps.tab || "标签项",
        children: child,
      };
    })?.filter(Boolean);
  }, [children]);

  // 内部 state 管理 activeKey
  const [activeKey, setActiveKey] = useState(
    rest.defaultActiveKey || (items && items.length > 0 ? items[0].key : "")
  );

  useImperativeHandle(ref, () => ({
    setActiveKey: (key: string) => {
      setActiveKey(key);
    },
  }));

  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  return (
    <AntdTabs
      style={styles}
      id={String(id)}
      {...rest}
      items={items}
      activeKey={activeKey}
      onChange={handleTabChange}
    />
  );
};

export default forwardRef(TabsProd);
