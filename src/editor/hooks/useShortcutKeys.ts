/**
 * @file /src/editor/hooks/useShortcutKeys.ts
 * @description
 * 一个用于集中管理和处理编辑器全局快捷键的自定义 Hook。
 * 它封装了 `keydown` 事件的监听、快捷键组合的判断（如 Cmd/Ctrl + C），
 * 以及触发对应的 Zustand store actions（如复制、粘贴、撤销、重做、删除）。
 * @module Hooks/useShortcutKeys
 */

import { useEffect, useMemo } from "react";
import { message } from "antd";
import {
  useComponetsStore,
  getComponentById,
  type Component,
} from "../stores/components";
import { useStore } from "zustand";
import { debounce } from "lodash-es";

/**
 * @description 为编辑器提供全局快捷键功能的 Hook。
 * 在顶层组件中调用一次即可生效。
 */
export function useShortcutKeys() {
  const {
    curComponentId,
    components,
    copyComponents,
    pasteComponents,
    deleteComponent,
    setCurComponentId,
  } = useComponetsStore();

  // 在 UI 层按需派生当前选中组件，避免在 store 中冗余存储快照
  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components]
  );

  const { undo, redo, pastStates, futureStates } = useStore(
    useComponetsStore.temporal
  );

  // 容器组件列表，用于智能粘贴，判断粘贴目标
  const ContainerList: Set<string> = new Set([
    "Container",
    "Page",
    "Modal",
    "Table",
  ]);

  // 使用 lodash 的 debounce 创建一个防抖版 message 函数
  const debouncedMessage = useMemo(
    () =>
      debounce((text: string) => {
        message.success(text);
      }, 300),
    []
  );

  useEffect(() => {
    /**
     * @description 全局键盘事件处理器
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // 防止在输入框、文本域或任何可编辑元素中触发快捷键
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      switch (e.key.toLowerCase()) {
        // 复制：Cmd/Ctrl + C
        case "c":
          if (isCmdOrCtrl && curComponentId) {
            e.preventDefault();
            copyComponents(curComponentId);
            debouncedMessage("复制成功");
          }
          break;

        // 粘贴：Cmd/Ctrl + V
        case "v":
          if (isCmdOrCtrl && curComponentId) {
            e.preventDefault();
            if (!curComponent) return;

            // 智能粘贴逻辑：如果当前选中是容器，则粘贴到其内部；
            // 否则，粘贴到其父容器中（成为兄弟节点）。
            const parentId = ContainerList.has(curComponent.name)
              ? curComponentId
              : curComponent.parentId;

            if (parentId) {
              pasteComponents(parentId);
              debouncedMessage("粘贴成功");
            }
          }
          break;

        // 撤销/重做
        case "z":
          // 撤销：Cmd/Ctrl + Z
          if (isCmdOrCtrl && pastStates.length > 0 && !isShift) {
            e.preventDefault();
            undo();
            debouncedMessage("撤销成功");
            // 重做：Cmd/Ctrl + Shift + Z
          } else if (isCmdOrCtrl && isShift && futureStates.length > 0) {
            e.preventDefault();
            redo();
            debouncedMessage("重做成功");
          }
          break;

        // 删除
        case "delete":
        case "backspace":
          if (curComponentId && curComponentId !== 1) {
            // 根组件 Page(id=1) 不允许删除
            e.preventDefault();
            deleteComponent(curComponentId);
            setCurComponentId(null);
            debouncedMessage("删除成功");
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    curComponent,
    curComponentId,
    copyComponents,
    pasteComponents,
    deleteComponent,
    setCurComponentId,
    undo,
    redo,
    pastStates,
    futureStates,
    debouncedMessage,
    ContainerList,
  ]);
}

