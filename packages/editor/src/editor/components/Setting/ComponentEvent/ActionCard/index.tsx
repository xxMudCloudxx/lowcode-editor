/**
 * @file /src/editor/components/Setting/ComponentEvent/ActionCard/index.tsx
 * @description
 * 一个纯展示组件，用于在事件面板中以卡片形式显示一个已配置的动作。
 * @module Components/Setting/ComponentEvent/ActionCard
 */
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button } from "antd";

export interface ActionCardProps {
  title: string;
  children?: any;
  onEdit: any;
  onDelete: any;
}
export const ActionCard = (props: ActionCardProps) => {
  const { title, children, onEdit, onDelete } = props;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2 shadow-sm hover:shadow-md transition-shadow duration-200 group mr-6">
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-800">{title}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={onEdit}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={onDelete}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          />
        </div>
      </div>

      {/* 内容区域 */}
      {children && (
        <div className="text-sm text-gray-600 space-y-1">{children}</div>
      )}
    </div>
  );
};
