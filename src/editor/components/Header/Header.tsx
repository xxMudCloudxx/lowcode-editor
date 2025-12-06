/**
 * @file /src/editor/components/Header/Header.tsx
 * @description
 * 应用的顶部全局页头组件。
 * 负责显示应用标题，并提供"预览"、"重置画布"、"撤销/重做"以及"快捷键指南"等核心功能入口。
 * @module Components/Header
 */

import { Button, Space, Popconfirm, Typography, Popover } from "antd";
import {
  QuestionCircleOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CodeOutlined,
  ClearOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
import {
  useComponentsStore,
  buildComponentTree,
} from "../../stores/components";
import { useUIStore } from "../../stores/uiStore";
import { useHistoryStore } from "../../stores/historyStore";
import { exportSourceCode } from "../../../code-generator";
import type { IGeneratedFile, ISchema } from "../../../code-generator/types/ir";
import { useState } from "react";
import { CodePreviewDrawer } from "../CodePreviewDrawer";

/**
 * @description 快捷键指南的 Popover 内容
 */
const shortcutsContent = (
  <div className="w-64 space-y-3">
    <div>
      <Text className="text-text-secondary text-xs font-medium uppercase tracking-wide">
        通用快捷键
      </Text>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + Z
        </Text>
        <Text className="text-text-secondary text-sm">撤销</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + Shift + Z
        </Text>
        <Text className="text-text-secondary text-sm">恢复</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + C
        </Text>
        <Text className="text-text-secondary text-sm">复制</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + V
        </Text>
        <Text className="text-text-secondary text-sm">粘贴</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Delete
        </Text>
        <Text className="text-text-secondary text-sm">删除</Text>
      </div>
    </div>
  </div>
);

/**
 * @description
 * 页头组件，包含标题和模式切换按钮。
 * - 使用 UI Store (`useUIStore`) 管理编辑/预览模式与当前选中组件
 * - 使用 Components Store (`useComponentsStore`) 管理画布数据与撤销/重做历史
 */
export function Header() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<IGeneratedFile[]>([]);

  const { resetComponents } = useComponentsStore();
  const { mode, setMode, setCurComponentId } = useUIStore();

  // 从 history store 中获取撤销/重做相关 state 和 actions
  const { undo, redo, clear, past, future } = useHistoryStore();

  /**
   * @description 处理画布重置逻辑
   * 它会调用 store action 来清空画布上的所有组件
   * 注意：此处的 "重置" 仅重置画布内容，不影响撤销/重做的历史记录
   */
  const handleReset = () => {
    resetComponents();
  };

  /**
   * @description 导出源码预览
   */
  const handleOpenCodePreview = async () => {
    setIsExporting(true);
    const { components, rootId } = useComponentsStore.getState();

    const schema = buildComponentTree(components, rootId);

    if (!schema || schema.length === 0) {
      console.error("Schema 为空，无法导出");
      setIsExporting(false);
      return;
    }

    try {
      // 调用 exportSourceCode 并指定 publisher: 'none'
      const result = await exportSourceCode(schema as ISchema, {
        publisher: "none",
      });

      if (result.success && result.files) {
        setGeneratedFiles(result.files);
        setIsDrawerVisible(true); // 打开抽屉
      } else {
        console.error("出码失败:", result.message);
        alert(`出码失败: ${result.message}`);
      }
    } catch (error) {
      console.error("执行 exportSourceCode 时发生异常", error);
      alert(`出码异常: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="h-full flex justify-between items-center">
        {/* 应用标题 */}
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-accent-600"
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
            <Title level={4} className="mb-0 text-neutral-800 font-semibold">
              低代码编辑器
            </Title>
            <Text className="text-xs text-neutral-400">
              Modern Low-Code Editor
            </Text>
          </div>
        </div>

        {/* 交互按钮区域 */}
        <Space size="middle">
          {/* 当处于"编辑"模式时，显示所有编辑相关操作按钮 */}
          {mode === "edit" && (
            <>
              {/* 快捷键帮助按钮 */}
              <Popover
                content={shortcutsContent}
                title={
                  <Title level={5} className="mb-2">
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
                />
              </Popover>

              {/* 撤销/重做按钮组 */}
              <div className="flex bg-neutral-100 rounded-lg p-1 gap-1">
                <Button
                  onClick={() => undo()}
                  disabled={!past.length}
                  size="middle"
                  icon={<UndoOutlined />}
                >
                  撤销
                </Button>
                <Button
                  onClick={() => redo()}
                  disabled={!future.length}
                  size="middle"
                  icon={<RedoOutlined />}
                >
                  重做
                </Button>
              </div>

              {/* 重置按钮组 */}
              <div className="flex gap-2">
                <Popconfirm
                  title="确认重置历史记录？"
                  description="此操作将清空所有撤销/重做历史，且无法恢复。"
                  onConfirm={clear}
                  okText="确认重置"
                  cancelText="取消"
                  placement="bottomRight"
                >
                  <Button size="middle" icon={<ClearOutlined />} danger>
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
                  <Button size="middle" icon={<DeleteOutlined />} danger>
                    重置画布
                  </Button>
                </Popconfirm>
              </div>

              {/* 出码按钮 */}
              <Button
                onClick={handleOpenCodePreview}
                loading={isExporting}
                icon={<CodeOutlined />}
              >
                {isExporting ? "生成中..." : "出码预览"}
              </Button>
              <CodePreviewDrawer
                visible={isDrawerVisible}
                loading={isExporting}
                files={generatedFiles}
                onClose={() => setIsDrawerVisible(false)}
              />

              {/* 预览按钮 */}
              <Button
                onClick={() => {
                  setMode("preview");
                  setCurComponentId(null);
                }}
                type="primary"
                size="middle"
                icon={<EyeOutlined />}
              >
                预览
              </Button>
            </>
          )}

          {/* 预览模式下仅显示"退出预览"按钮 */}
          {mode === "preview" && (
            <Button
              onClick={() => {
                setMode("edit");
              }}
              type="primary"
              size="middle"
              icon={<EyeInvisibleOutlined />}
            >
              退出预览
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
