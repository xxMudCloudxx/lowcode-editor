// src/editor/hooks/useActionManager.ts
import { useState } from "react";
import type { ComponentEvent } from "../stores/component-config";
import type { ActionConfig } from "../components/Setting/ComponentEvent/ActionModal";
import type { Component } from "@lowcode/schema";

// 这个Hook封装了所有关于Action的CRUD操作和模态框状态
export function useActionManager(
  curComponent: Component | null,
  updateComponentProps: (id: number, props: any) => void,
) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    event?: ComponentEvent;
    action?: ActionConfig;
    actionIndex?: number;
  }>({
    isOpen: false,
  });
  if (curComponent === null) return null;

  const openForCreate = (event: ComponentEvent) => {
    setModalState({
      isOpen: true,
      event,
      action: undefined,
      actionIndex: undefined,
    });
  };

  const openForEdit = (
    event: ComponentEvent,
    action: ActionConfig,
    index: number,
  ) => {
    setModalState({ isOpen: true, event, action, actionIndex: index });
  };

  const close = () => {
    setModalState({
      isOpen: false,
      event: undefined,
      action: undefined,
      actionIndex: undefined,
    });
  };

  const saveAction = (newActionConfig?: ActionConfig) => {
    if (!newActionConfig || !modalState.event || !curComponent) return;

    const { event, actionIndex } = modalState;
    const existingActions = curComponent.props[event.name]?.actions || [];
    let newActions;

    // 如果 actionIndex 存在，说明是编辑模式
    if (typeof actionIndex === "number") {
      newActions = existingActions.map((item: ActionConfig, index: number) =>
        index === actionIndex ? newActionConfig : item,
      );
    } else {
      // 否则是新增模式
      newActions = [...existingActions, newActionConfig];
    }

    updateComponentProps(curComponent.id, {
      [event.name]: { actions: newActions },
    });

    close();
  };

  const deleteAction = (event: ComponentEvent, index: number) => {
    if (!curComponent) return;
    const actions = curComponent.props[event.name]?.actions || [];
    const newActions = actions.filter((_: any, i: number) => i !== index);
    updateComponentProps(curComponent.id, {
      [event.name]: { actions: newActions },
    });
  };

  return {
    modalState,
    openForCreate,
    openForEdit,
    close,
    saveAction,
    deleteAction,
  };
}
