/**
 * @file /src/editor/components/Setting/ComponentEvent/index.tsx
 * @description
 * “事件”设置面板。
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

  // 将组件的事件配置转换为 antd Collapse 的数据源
  const items: CollapseProps["items"] = (
    componentConfig[curComponent.name].events || []
  ).map((event) => {
    return {
      key: event.name,
      label: (
        <div className="flex justify-between leading-[30px]">
          {event.label}
          <Button
            type="primary"
            onClick={(e) => {
              e.stopPropagation(); // 阻止 Collapse 的折叠/展开
              setCurEvent(event); // 记录当前事件
              setCurAction(undefined); // 清空上一次的编辑状态
              setCurActionIndex(undefined);
              setActionModalOpen(true);
            }}
          >
            添加动作
          </Button>
        </div>
      ),
      // 渲染已配置的动作列表
      children: (
        <div>
          {(curComponent.props[event.name]?.actions || []).map(
            (item: ActionConfig, index: number) => {
              const commonProps = {
                onEdit: () => editAction(item, index),
                onDelete: () => deleteAction(event, index),
              };
              return (
                <div>
                  {item.type === "goToLink" ? (
                    <ActionCard key={index} title="跳转链接" {...commonProps}>
                      <div>{item.url}</div>
                    </ActionCard>
                  ) : null}
                  {item.type === "showMessage" ? (
                    <ActionCard key={index} title="消息弹窗" {...commonProps}>
                      <div>{item.config.type}</div>
                      <div>{item.config.text}</div>
                    </ActionCard>
                  ) : null}
                  {item.type === "customJs" ? (
                    <ActionCard
                      key={index}
                      title="自定义 JS"
                      {...commonProps}
                    ></ActionCard>
                  ) : null}
                  {item.type === "componentMethod" ? (
                    <ActionCard key={index} title="组件方法" {...commonProps}>
                      <div>
                        {
                          getComponentById(item.config.componentId, components)
                            ?.desc
                        }
                      </div>
                      <div>{item.config.componentId}</div>
                      <div>{item.config.method}</div>
                    </ActionCard>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      ),
    };
  });

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

  return (
    <div className="px-[10px]">
      <Collapse
        className="mb-[10px]"
        items={items}
        defaultActiveKey={componentConfig[curComponent.name].events?.map(
          (item) => item.name
        )}
      />
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
