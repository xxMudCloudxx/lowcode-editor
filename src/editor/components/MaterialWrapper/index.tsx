import { Segmented } from "antd";
import { useState } from "react";
import { Material } from "./Material";
import { Outline } from "./Outline";
import { Source } from "./Source/index.tsx";

export function MaterialWrapper() {
  const [key, setKey] = useState<string>("物料");

  return (
    <div className="h-full flex flex-col">
      {/* 分段控制器 */}
      <div className="mb-6">
        <Segmented
          value={key}
          onChange={setKey}
          block
          options={[
            { label: "物料", value: "物料" },
            { label: "大纲", value: "大纲" },
            { label: "源码", value: "源码" },
          ]}
          className=""
        />
      </div>

      {/* 内容区域 */}
      <div className="custom-scrollbar h-[calc(100vh-100px)]">
        {key === "物料" && <Material />}
        {key === "大纲" && <Outline />}
        {key === "源码" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <Source />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
