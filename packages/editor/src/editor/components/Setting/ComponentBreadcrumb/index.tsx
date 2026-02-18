import { useMemo } from "react";

import { RightOutlined } from "@ant-design/icons";
import {
  getComponentById,
  useComponentsStore,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import type { Component } from "@lowcode/schema";

// 子组件保持不变，但样式将被大大简化
const BreadcrumbItem = ({
  component,
  isCurrent,
  onClick,
}: {
  component: Component;
  isCurrent: boolean;
  onClick: (id: number) => void;
}) => {
  // 1. 当前选中项的样式：使用项目主色文字 + 加粗
  if (isCurrent) {
    return <span className="text-sm ">{component.desc}</span>;
  }

  // 2. 可点击的父级项样式：使用次要文字色，hover 时变为主色 + 下划线
  return (
    <span
      className="text-sm text-gray-500  hover:underline cursor-pointer transition-colors duration-150"
      onClick={() => onClick(component.id)}
    >
      {component.desc}
    </span>
  );
};

export function ComponentBreadcrumb() {
  const { components } = useComponentsStore();
  const { curComponentId, setCurComponentId } = useUIStore();

  // 在 UI 层派生当前选中组件
  const curComponent = useMemo(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components],
  );

  const breadcrumbItems = useMemo(() => {
    const items: Component[] = [];
    let component = curComponent;

    while (component) {
      items.push(component);
      component = getComponentById(component.parentId!, components);
    }

    return items.reverse();
  }, [curComponent, components]);

  if (!curComponent) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 mb-1 px-1 py-1 select-none overflow-x-auto overscroll-x-contain ">
      {breadcrumbItems.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <BreadcrumbItem
            component={item}
            isCurrent={index === breadcrumbItems.length - 1}
            onClick={setCurComponentId}
          />

          {index < breadcrumbItems.length - 1 && (
            <RightOutlined
              className="ml-2 text-gray-400" // 增加左边距，让分隔符与文字拉开距离
              style={{ fontSize: "10px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
