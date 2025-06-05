import { Button, Collapse, type CollapseProps } from "antd";
import {
  type ComponentEvent,
  useComponentConfigStore,
} from "../../../stores/component-config";
import { useComponetsStore } from "../../../stores/components";
import { useState } from "react";
import { ActionModal, type ActionConfig } from "./ActionModal";
import { ActionCard } from "./ActionCard";

export function ComponentEvent() {
  const { curComponent, updateComponentProps } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [curEvent, setCurEvent] = useState<ComponentEvent>();
  const [curAction, setCurAction] = useState<ActionConfig>();
  const [curActionIndex, setCurActionIndex] = useState<number>();

  if (!curComponent) return null;

  function deleteAction(event: ComponentEvent, index: number) {
    if (!curComponent) {
      return;
    }

    const actions = curComponent.props[event.name]?.actions;

    actions.splice(index, 1);

    updateComponentProps(curComponent.id, {
      [event.name]: {
        actions: actions,
      },
    });
  }

  function editAction(config: ActionConfig, index: number) {
    if (!curComponent) {
      return;
    }
    setCurAction(config);
    setCurActionIndex(index);
    setActionModalOpen(true);
  }

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
              e.stopPropagation();

              setCurEvent(event);
              setActionModalOpen(true);
            }}
          >
            添加动作
          </Button>
        </div>
      ),
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
                </div>
              );
            }
          )}
        </div>
      ),
    };
  });

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
