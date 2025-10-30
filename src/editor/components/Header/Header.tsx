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
import { DownloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { exportSourceCode } from "../../../code-generator";
import type { ISchema } from "../../../code-generator/types/ir";

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

  // 3. 添加导出源码的处理函数
  const handleExportCode = async () => {
    console.log("开始导出源码...");

    // 从 store 获取当前 schema
    // 注意：getState() 可以让我在事件处理器中获取最新状态
    const { components } = useComponetsStore.getState();

    if (!components || components.length === 0) {
      console.error("Schema 为空，无法导出");
      return;
    }

    try {
      // 我的 store 里的类型是 IComponent[]，而出码入口需要 ISchema (即 ISchemaNode[])
      // 它们的结构兼容，所以我们使用类型断言
      const result = await exportSourceCode(components as ISchema);

      if (result.success && result.files) {
        console.log("出码成功！生成文件列表:", result.files);

        // 打印第一个文件的内容（即生成的 TSX）
        if (result.files.length > 0) {
          result.files.map((file) => {
            console.log("生成的 TSX 代码:\n", file.content);
          });
          alert("出码成功，请查看控制台！");
        } else {
          console.warn("出码成功，但未生成任何文件。");
        }
      } else {
        console.error("出码失败:", result.message);
        alert(`出码失败: ${result.message}`);
      }
    } catch (error) {
      console.error("执行 exportSourceCode 时发生异常:", error);
      alert(`出码异常: ${error}`);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="h-full flex justify-between items-center">
        {/* 应用标题 */}
        <div className="flex items-center space-x-3">
          <svg
            className="w-8 h-8"
            viewBox="0 0 1112 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M952.181449 1024.005564H158.694126C71.050677 1024.005564 0 953.093996 0 865.617475V158.438168C0 70.961648 71.050677 0.050079 158.694126 0.050079h793.487323C1039.824898 0.050079 1112.862033 70.961648 1112.862033 158.438168v707.179307c0 87.47652-73.037135 158.388089-160.680584 158.388089zM311.601369 289.455415L89.028963 512.027822l217.008096 222.572406 61.207412-55.643101-161.364995-166.929305 166.929305-161.364995-61.207412-61.207412z m400.630332-133.543444h-144.672064L478.530674 795.80764H400.630332v72.336032h155.800685l77.900342-639.895669h77.900342V155.911971z m89.028963 133.543444l-61.207412 61.207412 166.929305 161.364995-161.364995 166.929305 61.207412 55.643101 217.008097-222.572406-222.572407-222.572407z"
              fill="currentColor"
            />
          </svg>
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

              {/* 4. 出码按钮 */}
              <Button icon={<DownloadOutlined />} onClick={handleExportCode}>
                测试出码
              </Button>

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
