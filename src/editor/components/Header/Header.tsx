/**
 * @file /src/editor/components/Header/Header.tsx
 * @description
 * 应用的顶部全局页头组件。
 * 负责显示应用标题，并提供“预览”、“重置画布”、“撤销/重做”以及“快捷键指南”等核心功能入口。
 * @module Components/Header
 */

import { Button, Space, Popconfirm, Typography, Popover } from "antd";

const { Text, Title } = Typography;
import { useComponetsStore } from "../../stores/components";
import { useStore } from "zustand";
import { QuestionCircleOutlined } from "@ant-design/icons";

/**
 * @description 快捷键指南的 Popover 内容。
 */
const shortcutsContent = (
  <div style={{ width: "260px" }}>
    <Space direction="vertical">
      <Text>
        <strong>通用快捷键</strong>
      </Text>
      <div>
        <Text code>Cmd/Ctrl + Z</Text>: 撤销更改
      </div>
      <div>
        <Text code>Cmd/Ctrl + Shift + Z</Text>: 恢复更改
      </div>
      <div>
        <Text code>Cmd/Ctrl + C</Text>: 复制选中组件
      </div>
      <div>
        <Text code>Cmd/Ctrl + V</Text>: 粘贴到选中容器或同级
      </div>
      <div>
        <Text code>Delete / Backspace</Text>: 删除选中组件
      </div>
    </Space>
  </div>
);

/**
 * @description
 * 页头组件，包含标题和模式切换按钮。
 * 通过 Zustand store (`useComponetsStore`) 来获取和控制当前的编辑器模式，
 * 并通过 `useStore(useComponetsStore.temporal)` 来访问 zundo 中间件提供的撤销/重做状态和方法。
 */
export function Header() {
  const { mode, setMode, setCurComponentId, resetComponents } =
    useComponetsStore();

  // 从 temporal store 中获取撤销/重做相关 state 和 actions
  const { undo, redo, clear, pastStates, futureStates } = useStore(
    useComponetsStore.temporal
  );

  /**
   * @description 处理画布重置逻辑。
   * 它会调用 store action 来清空画布上的所有组件。
   * 注意：此处的 "重置" 仅重置画布内容，不影响撤销/重做的历史记录。
   */
  const handleReset = () => {
    resetComponents();
  };

  return (
    <div className="w-full h-full">
      <div className="h-full flex justify-between items-center">
        {/* 应用标题 */}
        <div className="flex items-center space-x-3">
          <img src="src\assets\icon.svg" alt="logo" className="w-8 h-8" />
          <div>
            <Title level={4} className="!mb-0 !text-gray-800 font-semibold">
              低代码编辑器
            </Title>
            <Text className="text-xs text-gray-500">
              Modern Low-Code Editor
            </Text>
          </div>
        </div>

        {/* 交互按钮区域 */}
        <Space size="middle">
          {/* 当处于“编辑”模式时，显示所有编辑相关操作按钮 */}
          {mode === "edit" && (
            <>
              {/* 快捷键帮助按钮 */}
              <Popover
                content={shortcutsContent}
                title={
                  <Title level={5} className="!mb-2">
                    快捷键指南
                  </Title>
                }
                trigger="click"
                overlayClassName="custom-popover"
              >
                <Button
                  icon={<QuestionCircleOutlined />}
                  shape="circle"
                  size="middle"
                  className="!border-gray-300 !h-9 !w-9 hover:!border-indigo-400 hover:!bg-indigo-50 !shadow-sm"
                />
              </Popover>

              {/* 撤销/重做按钮组 */}
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                <Button
                  onClick={() => undo()}
                  disabled={!pastStates.length}
                  size="middle"
                  className="!border !border-gray-200 !bg-gray-50 !h-8 hover:!bg-white hover:!shadow-sm hover:!border-gray-300 disabled:!bg-gray-100 disabled:!border-gray-100"
                >
                  撤销
                </Button>
                <Button
                  onClick={() => redo()}
                  disabled={!futureStates.length}
                  size="middle"
                  className="!border !border-gray-200 !bg-gray-50 !h-8 hover:!bg-white hover:!shadow-sm hover:!border-gray-300 disabled:!bg-gray-100 disabled:!border-gray-100"
                >
                  重做
                </Button>
              </div>

              {/* 重置按钮组 */}
              <div className="flex space-x-2">
                <Popconfirm
                  title="确认重置历史记录？"
                  description="此操作将清空所有撤销/重做历史，且无法恢复。"
                  onConfirm={clear}
                  okText="确认重置"
                  cancelText="取消"
                  placement="bottomRight"
                >
                  <Button
                    size="middle"
                    className="!border-red-300 !text-red-600 !h-8 hover:!border-red-400 hover:!bg-red-50 !shadow-sm"
                  >
                    重置历史
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="确认重置画布？"
                  description="此操作将清空所有组件，且无法撤销。"
                  onConfirm={handleReset}
                  okText="确认重置"
                  cancelText="取消"
                  placement="bottomRight"
                >
                  <Button
                    size="middle"
                    className="!border-red-300 !text-red-600 !h-8 hover:!border-red-400 hover:!bg-red-50 !shadow-sm"
                  >
                    重置画布
                  </Button>
                </Popconfirm>
              </div>

              {/* 预览按钮 */}
              <Button
                onClick={() => {
                  setMode("preview");
                  setCurComponentId(null);
                }}
                type="primary"
                size="middle"
                className="!bg-indigo-600 hover:!bg-indigo-700 !border-indigo-600 hover:!border-indigo-700 !h-9 !shadow-md"
              >
                预览
              </Button>
            </>
          )}

          {/* 当处于"预览"模式时，只显示"退出预览"按钮 */}
          {mode === "preview" && (
            <Button
              onClick={() => {
                setMode("edit");
              }}
              type="primary"
              size="middle"
              className="!h-9 !border-indigo-600 hover:!border-indigo-700 !shadow-md"
            >
              退出预览
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
