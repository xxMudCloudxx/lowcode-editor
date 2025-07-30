// src/editor/materials/Navigation/Tabs/dev.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { useDrag } from "react-dnd";
import { Tabs as AntdTabs } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";

const TabsDev = ({
  id,
  name,
  children,
  isSelected,
  styles,
  ...props
}: CommonComponentProps) => {
  const { isOver, drop } = useMaterailDrop(id, name);
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  useEffect(() => {
    drop(divRef);
    drag(divRef);
  }, [drag, drop]);

  // 核心转换逻辑：将 children 转换为 antd tabs 的 items
  const items = useMemo(() => {
    return React.Children.map(children, (child: any) => {
      if (!child) return null;
      const tabPaneProps = child.props?.children?.props;
      if (!tabPaneProps) return null;

      return {
        key: String(tabPaneProps.id),
        label: tabPaneProps.tab || "标签项",
        children: child, // 直接将 TabPane 的 dev 版本作为内容
      };
    })?.filter(Boolean);
  }, [children]);

  const hasChildren = items && items.length > 0;

  return (
    <div
      ref={divRef}
      data-component-id={id}
      style={styles}
      className={`min-h-[100px] p-1 -ml-px -mt-px ${
        isSelected
          ? ""
          : `border border-dashed border-gray-400 ${
              isOver ? "outline outline-blue-500" : ""
            }`
      }`}
    >
      <AntdTabs style={styles} {...props} items={items} />
      {!hasChildren && (
        <div className="h-[80px] w-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm select-none pointer-events-none">
          请拖拽“标签项”组件到这里
        </div>
      )}
    </div>
  );
};

export default TabsDev;
