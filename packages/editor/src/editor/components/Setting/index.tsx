/**
 * @file /src/editor/components/Setting/index.tsx
 * @description
 * 设置面板的根组件和入口。
 * 它作为一个“路由”或“分发器”，根据用户在分段控制器上的选择，
 * 条件性地渲染属性、样式或事件的设置面板。
 * @module Components/Setting
 */

import { useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import { Segmented } from "antd";
import { ComponentAttr } from "./ComponentAttr";
import { ComponentStyle } from "./ComponentStyle";
import { ComponentEvent } from "./ComponentEvent";
import { ComponentBreadcrumb } from "./ComponentBreadcrumb";

const EmptyStatus = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        选择组件进行配置
      </h3>
      <p className="text-sm text-gray-500 max-w-xs">
        在画布中点击任意组件，即可在此处编辑其属性、样式和事件
      </p>
    </div>
  );
};

export function Setting() {
  const curComponentId = useUIStore((s) => s.curComponentId);

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
          className="select-none"
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
