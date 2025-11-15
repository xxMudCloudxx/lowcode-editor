/**
 * @file /src/editor/components/Setting/ComponentEvent/index.tsx
 * @description
 * "事件"设置面板的主组件。
 * 经过重构，该组件现在主要负责UI布局和状态协调，
 * 具体的业务逻辑和渲染细节已委托给自定义Hooks和子组件。
 * @module Components/Setting/ComponentEvent
 */
import { Collapse, Input, type CollapseProps } from "antd";
import { useState, useMemo } from "react";
import {
  useComponetsStore,
  getComponentById,
  type Component,
} from "../../../stores/components";
import { useComponentConfigStore } from "../../../stores/component-config";

// 引入子组件和模态框
import { ActionModal } from "./ActionModal";
import { EventItem } from "./EventItem";

// 引入自定义 Hooks
import { useEventSearch } from "../../../hooks/useEventSearch";
import { useActionManager } from "../../../hooks/useActionManager";
import { ArrowIcon } from "../../common/ArrowIcon";

export function ComponentEvent() {
  // --- 状态和数据获取 ---
  const { curComponentId, components, updateComponentProps } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();
  const [searchKeyword, setSearchKeyword] = useState("");

  // 在 UI 层按需派生当前选中组件
  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components]
  );

  // 如果没有选中任何组件，则不渲染任何内容
  if (!curComponent) {
    return null;
  }

  // useActionManager Hook 负责所有动作的增删改查(CRUD)以及模态框状态管理
  const actionManager = useActionManager(curComponent, updateComponentProps);

  // useEventSearch Hook 负责事件列表的搜索、评分和排序
  const allEvents = curComponent
    ? componentConfig[curComponent.name]?.events
    : [];
  const filteredEvents = useEventSearch(allEvents, searchKeyword);

  // 数据转换：将事件数据映射为 Collapse 组件需要的 items 格式 ---
  // 这里的逻辑非常清晰：遍历筛选后的事件，然后调用 EventItem 组件来生成配置对象
  const collapseItems: CollapseProps["items"] = filteredEvents.map((event) => {
    const actions = curComponent.props[event.name]?.actions || [];

    // 调用 EventItem 函数，将所有需要的 props 传入
    return EventItem({
      event,
      actions,
      onAddAction: () => actionManager.openForCreate(event),
      onEditAction: (action, index) =>
        actionManager.openForEdit(event, action, index),
      onDeleteAction: (index) => actionManager.deleteAction(event, index),
    });
  });

  return (
    <div className="h-full flex flex-col">
      {/* 搜索框 */}
      <div className="px-1 mb-4">
        <Input.Search
          placeholder="搜索事件名称..."
          onSearch={setSearchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
        />
      </div>

      {/* 事件配置区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {allEvents?.length === 0 ? (
          // 无可配置事件时的占位UI
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-3">🎯</div>
            <div className="text-sm font-medium mb-1">该组件暂无可配置事件</div>
            <div className="text-xs">请选择其他支持事件的组件</div>
          </div>
        ) : (
          // 折叠面板，直接使用上面生成的 collapseItems
          <Collapse
            className="border-0 bg-transparent overflow-y-auto h-[80%] w-[90%] absolute overscroll-y-contain pb-90"
            items={collapseItems}
            defaultActiveKey={allEvents?.map((item) => item.name)}
            ghost
            expandIconPosition="end"
            size="small"
            expandIcon={({ isActive }) => <ArrowIcon isActive={isActive} />}
          />
        )}
      </div>

      {/* 动作配置模态框，其状态完全由 actionManager Hook 控制 */}
      <ActionModal
        visible={actionManager.modalState.isOpen}
        handleOk={actionManager.saveAction}
        action={actionManager.modalState.action}
        handleCancel={actionManager.close}
      />
    </div>
  );
}
