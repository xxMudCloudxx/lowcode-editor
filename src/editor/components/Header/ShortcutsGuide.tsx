/**
 * @file ShortcutsGuide.tsx
 * @description 快捷键指南组件 - 包含按钮和 Popover，与 Header 中原样式一致
 */

import { Typography, Popover, Button } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

/**
 * 快捷键指南内容
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

    {/* 画布缩放快捷键 */}
    <div>
      <Text className="text-text-secondary text-xs font-medium uppercase tracking-wide">
        画布缩放
      </Text>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + =
        </Text>
        <Text className="text-text-secondary text-sm">放大画布</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + -
        </Text>
        <Text className="text-text-secondary text-sm">缩小画布</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + 0
        </Text>
        <Text className="text-text-secondary text-sm">重置为 100%</Text>
      </div>
    </div>
  </div>
);

/**
 * 快捷键指南组件
 * UI 与 Header 中原样式完全一致
 */
export function ShortcutsGuide() {
  return (
    <Popover
      content={shortcutsContent}
      title={
        <Title level={5} className="mb-2!">
          快捷键指南
        </Title>
      }
      trigger="click"
      placement="bottom"
    >
      <Button icon={<QuestionCircleOutlined />} size="small" type="text" />
    </Popover>
  );
}

export default ShortcutsGuide;
