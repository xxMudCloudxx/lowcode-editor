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

export function Setting() {
  const { curComponentId } = useComponetsStore();

  // 使用 state 管理当前激活的面板 key ('属性', '样式', '事件')
  const [key, setKey] = useState<string>("属性");

  // 如果当前没有选中任何组件，则不渲染设置面板
  if (!curComponentId) return null;

  return (
    <div>
      <Segmented
        value={key}
        onChange={setKey}
        block
        options={["属性", "样式", "事件"]}
      />
      <div className="pt-[20px]">
        {/* 根据 key 条件性渲染对应的子面板 */}
        {key === "属性" && <ComponentAttr />}
        {key === "样式" && <ComponentStyle />}
        {key === "事件" && <ComponentEvent />}
      </div>
    </div>
  );
}
