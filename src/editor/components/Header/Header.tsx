/**
 * @file /src/editor/components/Header/Header.tsx
 * @description
 * 应用的顶部全局页头组件。
 * 负责显示应用标题，并提供“预览”和“退出预览”的功能入口。
 * @module Components/Header
 */

import { Button, Space, Popconfirm, Typography, Popover } from "antd";

const { Text } = Typography;
import { useComponetsStore } from "../../stores/components";
import { useStore } from "zustand";
import Title from "antd/es/typography/Title";
import { QuestionCircleOutlined } from "@ant-design/icons";

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
 * 通过 Zustand store (`useComponetsStore`) 来获取和控制当前的编辑器模式。
 */
export function Header() {
  const { mode, setMode, setCurComponentId, resetComponents } =
    useComponetsStore();

  // 从 temporal store 中多获取一个 clear 方法
  const { undo, redo, clear, pastStates, futureStates } = useStore(
    useComponetsStore.temporal
  );

  /**
   * @description 处理画布重置逻辑,包括状态和历史记录
   */
  const handleReset = () => {
    resetComponents();
  };

  return (
    <div className="w-[100%] h-[100%]">
      <div className="h-[50px] flex justify-between items-center px-[20px]">
        {/* 应用标题 */}
        <div>低代码编辑器</div>

        {/* 交互按钮区域 */}
        <Space>
          {/*帮助按钮，显示快捷键*/}
          <Popover
            content={shortcutsContent}
            title={<Title level={5}>快捷键指南</Title>}
            trigger="click" // 设置为点击触发
          >
            <Button icon={<QuestionCircleOutlined />} shape="circle" />
          </Popover>
          {/* 当处于“编辑”模式时，显示“预览”和“重置”按钮 */}
          {mode === "edit" && (
            <>
              {/* 2. 新增撤销、重做和重置历史记录按钮 */}
              <Button onClick={() => undo()} disabled={!pastStates.length}>
                撤销
              </Button>
              <Button onClick={() => redo()} disabled={!futureStates.length}>
                重做
              </Button>

              <Popconfirm
                title="确认重置历史记录？"
                description="此操作将清空所有历史记录，且无法撤销。"
                onConfirm={clear}
                okText="确认重置"
                cancelText="取消"
                placement="bottomRight"
                className="mr-[20px]"
              >
                <Button danger>重置历史记录</Button>
              </Popconfirm>

              <Popconfirm
                title="确认重置画布？"
                description="此操作将清空所有组件，且无法撤销。"
                onConfirm={handleReset}
                okText="确认重置"
                cancelText="取消"
                placement="bottomRight"
              >
                <Button danger>重置</Button>
              </Popconfirm>

              <Button
                onClick={() => {
                  setMode("preview");
                  setCurComponentId(null);
                }}
                type="primary"
              >
                预览
              </Button>
            </>
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
