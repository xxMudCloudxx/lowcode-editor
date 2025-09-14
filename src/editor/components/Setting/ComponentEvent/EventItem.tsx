/**
 * @file /src/editor/components/Setting/ComponentEvent/EventItem.tsx
 * @description
 * 负责渲染事件设置中的单个可折叠项。
 * 它接收事件数据和相关的动作列表，并生成UI以及处理用户交互的回调。
 * @module Components/Setting/ComponentEvent/EventItem
 */
import { Button } from "antd";
import { ActionCard } from "./ActionCard";
import {
  getComponentById,
  useComponetsStore,
} from "../../../stores/components";
import type { ComponentEvent } from "../../../stores/component-config";
import type { ActionConfig } from "./ActionModal";

// 定义组件接收的属性（Props）
interface EventItemProps {
  event: ComponentEvent;
  actions: ActionConfig[];
  onAddAction: () => void;
  onEditAction: (action: ActionConfig, index: number) => void;
  onDeleteAction: (index: number) => void;
}

/**
 * EventItem 组件的主要逻辑。
 * 注意：它没有返回 JSX，而是返回一个符合 antd Collapse `items` 属性要求的对象。
 * 这样做可以使主组件的逻辑更简洁。
 */
export function EventItem({
  event,
  actions,
  onAddAction,
  onEditAction,
  onDeleteAction,
}: EventItemProps) {
  // 从 Zustand Store 中获取所有组件列表，用于查找组件名称
  const { components } = useComponetsStore.getState();

  // --- 1. 构建面板的头部 (Label) ---
  const label = (
    <div className="flex items-center justify-between min-h-[40px]">
      <div className="flex items-center">
        <span className="text-base font-medium text-gray-800 leading-6">
          {event.label}
        </span>
      </div>
      <Button
        type="primary"
        onClick={(e) => {
          // 阻止点击按钮时折叠面板也跟着展开/收起
          e.stopPropagation();
          onAddAction();
        }}
        className="bg-transparent hover:bg-blue-50 border-2 border-blue-500 hover:border-blue-600 text-blue-600 hover:text-blue-700 transition-all duration-200 text-sm font-medium px-4 py-2.5 h-10 rounded flex items-center gap-1.5"
      >
        <span className="text-base leading-none">+</span>
        <span>添加动作</span>
      </Button>
    </div>
  );

  // --- 2. 构建面板的内容区域 (Children) ---
  const children = (
    <div className="pt-0">
      {actions.length === 0 ? (
        // 如果没有动作，显示提示信息
        <div className="text-center py-8 text-gray-400">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm">暂无动作配置</div>
          <div className="text-xs mt-1">点击上方按钮添加动作</div>
        </div>
      ) : (
        // 如果有动作，遍历并渲染每一个动作卡片
        actions.map((item, index) => {
          // 将 onEdit 和 onDelete 回调函数包装成通用属性
          const commonProps = {
            onEdit: () => onEditAction(item, index),
            onDelete: () => onDeleteAction(index),
          };

          return (
            <div key={index} className="mb-2 last:mb-0 ">
              {item.type === "goToLink" ? (
                <ActionCard title="跳转链接" {...commonProps}>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">URL:</span>
                    <span className="text-blue-600 truncate">{item.url}</span>
                  </div>
                </ActionCard>
              ) : null}

              {item.type === "showMessage" ? (
                <ActionCard title="消息弹窗" {...commonProps}>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">类型:</span>
                      <span className="text-sm font-medium">
                        {item.config.type}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">内容:</span>
                      <span className="text-sm truncate">
                        {item.config.text}
                      </span>
                    </div>
                  </div>
                </ActionCard>
              ) : null}

              {item.type === "customJs" ? (
                <ActionCard title="自定义 JS" {...commonProps}>
                  <div className="text-xs text-gray-500">
                    执行自定义JavaScript代码
                  </div>
                </ActionCard>
              ) : null}

              {item.type === "componentMethod" ? (
                <ActionCard title="组件方法" {...commonProps}>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">组件:</span>
                      <span className="text-sm font-medium">
                        {
                          getComponentById(item.config.componentId, components)
                            ?.desc
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">ID:</span>
                      <span className="text-xs text-gray-600">
                        {item.config.componentId}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">方法:</span>
                      <span className="text-sm font-mono text-purple-600">
                        {item.config.method}
                      </span>
                    </div>
                  </div>
                </ActionCard>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );

  // --- 3. 返回符合 antd Collapse `items` 格式的对象 ---
  return {
    key: event.name,
    label: label,
    children: children,
  };
}
