/**
 * @file /src/editor/components/Setting/index.tsx
 * @description
 * 设置面板的根组件和入口。
 * 它作为一个“路由”或“分发器”，根据用户在分段控制器上的选择，
 * 条件性地渲染属性、样式或事件的设置面板。
 * @module Components/Setting
 */

import { useState } from "react";
import { useComponetsStore } from "../../stores/components";
import { Segmented } from "antd";
import { ComponentAttr } from "./ComponentAttr";
import { ComponentStyle } from "./ComponentStyle";
import { ComponentEvent } from "./ComponentEvent";
import { ComponentBreadcrumb } from "./ComponentBreadcrumb";
import { EmptyStatus } from "./emptyStatus";

export function Setting() {
  const { curComponentId } = useComponetsStore();

  // 使用 state 管理当前激活的面板 key ('属性', '样式', '事件')
  const [key, setKey] = useState<string>("属性");

  // 如果当前没有选中任何组件，则显示空状态
  if (!curComponentId) {
    return <EmptyStatus />;
  }

  return (
    <div className="h-full flex flex-col">
      <ComponentBreadcrumb />
      {/* 分段控制器 */}
      <div className="mb-6">
        <Segmented
          value={key}
          onChange={setKey}
          block
          options={[
            { label: "属性", value: "属性" },
            { label: "样式", value: "样式" },
            { label: "事件", value: "事件" },
          ]}
          className="!bg-gray-50 !p-1 select-none"
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 根据 key 条件性渲染对应的子面板 */}
        {key === "属性" && <ComponentAttr />}
        {key === "样式" && <ComponentStyle />}
        {key === "事件" && <ComponentEvent />}
      </div>
    </div>
  );
}
