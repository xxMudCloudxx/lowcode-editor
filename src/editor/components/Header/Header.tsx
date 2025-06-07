/**
 * @file /src/editor/components/Header/Header.tsx
 * @description
 * 应用的顶部全局页头组件。
 * 负责显示应用标题，并提供“预览”和“退出预览”的功能入口。
 * @module Components/Header
 */

import { Button, Space } from "antd";
import { useComponetsStore } from "../../stores/components";

/**
 * @description
 * 页头组件，包含标题和模式切换按钮。
 * 通过 Zustand store (`useComponetsStore`) 来获取和控制当前的编辑器模式。
 */
export function Header() {
  const { mode, setMode, setCurComponentId } = useComponetsStore();

  return (
    <div className="w-[100%] h-[100%]">
      <div className="h-[50px] flex justify-between items-center px-[20px]">
        {/* 应用标题 */}
        <div>低代码编辑器</div>

        {/* 交互按钮区域 */}
        <Space>
          {/* 当处于“编辑”模式时，显示“预览”按钮 */}
          {mode === "edit" && (
            <Button
              onClick={() => {
                setMode("preview");
                // 关键：进入预览模式时，清空当前选中的组件，
                // 避免在预览时还保留着编辑状态的选中框或设置面板。
                setCurComponentId(null);
              }}
              type="primary"
            >
              预览
            </Button>
          )}

          {/* 当处于“预览”模式时，显示“退出预览”按钮 */}
          {mode === "preview" && (
            <Button
              onClick={() => {
                setMode("edit");
              }}
              type="primary"
            >
              退出预览
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
