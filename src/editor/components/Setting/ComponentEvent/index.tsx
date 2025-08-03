/**
 * @file /src/editor/components/Setting/ComponentEvent/index.tsx
 * @description
 * "事件"设置面板。
 * 负责管理和展示组件所有可配置的事件及其绑定的动作列表。
 * @module Components/Setting/ComponentEvent
 */
import { Button, Collapse, type CollapseProps } from "antd";
import {
  type ComponentEvent,
  useComponentConfigStore,
} from "../../../stores/component-config";
import {
  getComponentById,
  useComponetsStore,
} from "../../../stores/components";
import { useState } from "react";
import { ActionModal, type ActionConfig } from "./ActionModal";
import { ActionCard } from "./ActionCard";

// 自定义箭头图标
const ArrowIcon = ({ isActive }: { isActive?: boolean }) => (
  <div className="flex items-start justify-center w-8 h-6 mt-4 -mr-1">
    <svg
      className={`w-5 h-5 text-gray-700 transition-transform duration-200 ${
        isActive ? "rotate-90" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </div>
);

export function ComponentEvent() {
  const { curComponent, updateComponentProps, components } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // --- Modal and Action State Management ---
  const [actionModalOpen, setActionModalOpen] = useState(false); // 控制动作配置模态框的显隐
  const [curEvent, setCurEvent] = useState<ComponentEvent>(); // 记录当前正在配置哪个事件 (e.g., 'onClick')
  const [curAction, setCurAction] = useState<ActionConfig>(); // 记录当前正在编辑的动作，用于模态框回显
  const [curActionIndex, setCurActionIndex] = useState<number>(); // 记录当前编辑的动作在数组中的索引

  if (!curComponent) return null;

  /**
   * @description 删除指定事件下的一个动作。
   */
  function deleteAction(event: ComponentEvent, index: number) {
    if (!curComponent) {
      return;
    }

    const actions = curComponent.props[event.name]?.actions || [];

    const newActions = actions.filter(
      (_: ActionConfig, i: number) => i !== index
    );

    updateComponentProps(curComponent.id, {
      [event.name]: {
        actions: newActions,
      },
    });
  }

  /**
   * @description 打开模态框以编辑一个已有的动作。
   */
  function editAction(config: ActionConfig, index: number) {
    if (!curComponent) {
      return;
    }
    setCurAction(config);
    setCurActionIndex(index);
    setActionModalOpen(true);
  }

  /**
   * @description 模态框确认回调，用于新增或更新动作。
   */
  function handleModalOk(config?: ActionConfig) {
    if (!config || !curEvent || !curComponent) {
      return;
    }
    /**
     *保存的时候如果有 curAction，就是修改，没有的话才是新增
     */
    if (curAction) {
      updateComponentProps(curComponent.id, {
        [curEvent.name]: {
          actions: curComponent.props[curEvent.name]?.actions.map(
            (item: ActionConfig, index: number) => {
              return index === curActionIndex ? config : item;
            }
          ),
        },
      });
    } else {
      updateComponentProps(curComponent.id, {
        [curEvent.name]: {
          actions: [
            ...(curComponent.props[curEvent.name]?.actions || []),
            config,
          ],
        },
      });
    }

    setCurAction(undefined);
    setActionModalOpen(false);
  }

  // 将组件的事件配置转换为 antd Collapse 的数据源
  const items: CollapseProps["items"] = (
    componentConfig[curComponent.name].events || []
  ).map((event) => {
    return {
      key: event.name,
      label: (
        <div className="flex items-center justify-between  min-h-[40px]">
          <div className="flex items-center">
            <span className="text-base font-medium text-gray-800 leading-6">
              {event.label}
            </span>
          </div>
          <Button
            type="primary"
            onClick={(e) => {
              e.stopPropagation(); // 阻止 Collapse 的折叠/展开
              setCurEvent(event); // 记录当前事件
              setCurAction(undefined); // 清空上一次的编辑状态
              setCurActionIndex(undefined);
              setActionModalOpen(true);
            }}
            className="bg-transparent hover:bg-blue-50 border-2 border-blue-500 hover:border-blue-600 text-blue-600 hover:text-blue-700 transition-all duration-200 text-sm font-medium px-4 py-2.5 h-10 rounded flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>添加动作</span>
          </Button>
        </div>
      ),
      // 渲染已配置的动作列表
      children: (
        <div className="pt-0">
          {(curComponent.props[event.name]?.actions || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm">暂无动作配置</div>
              <div className="text-xs mt-1">点击上方按钮添加动作</div>
            </div>
          ) : (
            (curComponent.props[event.name]?.actions || []).map(
              (item: ActionConfig, index: number) => {
                const commonProps = {
                  onEdit: () => editAction(item, index),
                  onDelete: () => deleteAction(event, index),
                };
                return (
                  <div key={index}>
                    {item.type === "goToLink" ? (
                      <ActionCard title="跳转链接" {...commonProps}>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">
                            URL:
                          </span>
                          <span className="text-blue-600 truncate">
                            {item.url}
                          </span>
                        </div>
                      </ActionCard>
                    ) : null}
                    {item.type === "showMessage" ? (
                      <ActionCard title="消息弹窗" {...commonProps}>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">
                              类型:
                            </span>
                            <span className="text-sm font-medium">
                              {item.config.type}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">
                              内容:
                            </span>
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
                            <span className="text-xs text-gray-500 mr-2">
                              组件:
                            </span>
                            <span className="text-sm font-medium">
                              {
                                getComponentById(
                                  item.config.componentId,
                                  components
                                )?.desc
                              }
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">
                              ID:
                            </span>
                            <span className="text-xs text-gray-600">
                              {item.config.componentId}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">
                              方法:
                            </span>
                            <span className="text-sm font-mono text-purple-600">
                              {item.config.method}
                            </span>
                          </div>
                        </div>
                      </ActionCard>
                    ) : null}
                  </div>
                );
              }
            )
          )}
        </div>
      ),
    };
  });

  return (
    <div>
      {/* 事件配置区域 */}
      {componentConfig[curComponent.name].events?.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-3xl mb-3">🎯</div>
          <div className="text-sm font-medium mb-1">该组件暂无可配置事件</div>
          <div className="text-xs">请选择其他支持事件的组件</div>
        </div>
      ) : (
        <Collapse
          className="border-0 bg-transparent h-full absolute overflow-y-auto overscroll-y-contain pb-90"
          items={items}
          defaultActiveKey={componentConfig[curComponent.name].events?.map(
            (item) => item.name
          )}
          ghost
          expandIconPosition="end"
          size="small"
          expandIcon={({ isActive }) => <ArrowIcon isActive={isActive} />}
        />
      )}

      {/* 动作配置模态框 */}
      <ActionModal
        visible={actionModalOpen}
        handleOk={handleModalOk}
        action={curAction}
        handleCancel={() => {
          setActionModalOpen(false);
        }}
      />
    </div>
  );
}
