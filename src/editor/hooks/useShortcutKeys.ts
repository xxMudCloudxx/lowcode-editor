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
import { useComponetsStore } from "../stores/components";
import { useStore } from "zustand";
import { debounce } from "lodash-es";

/**
 * @description 一个独立的 Hook，用于为编辑器提供全局快捷键功能。
 * 它不接收任何 props，在 `ReactPlayground` 组件中被调用一次即可生效。
 */
export function useShortcutKeys() {
  const {
    curComponentId,
    curComponent,
    copyComponents,
    pasteComponents,
    deleteComponent,
    setCurComponentId, // 新增，用于删除后清空选中
  } = useComponetsStore();

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

  // 使用 lodash 的 debounce 创建一个防抖版的 message 函数，
  // 避免在高频操作（如快速撤销）时消息提示过于频繁，提升用户体验。
  const debouncedMessage = useMemo(
    () =>
      debounce((text: string) => {
        message.success(text);
      }, 300),
    []
  );

  useEffect(() => {
    /**
     * @description 全局键盘事件处理器。
     * @param {KeyboardEvent} e - 键盘事件对象。
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // 关键校验：防止在输入框、文本域或任何可编辑元素中触发快捷键。
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // 判断是否按下了 Cmd (Mac) 或 Ctrl (Windows)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // 使用 toLowerCase() 确保大小写不敏感
      switch (e.key.toLowerCase()) {
        // 复制：Cmd/Ctrl + C
        case "c":
          if (isCmdOrCtrl && curComponentId) {
            e.preventDefault(); // 阻止浏览器默认的复制行为
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
            setCurComponentId(null); // 删除后清空选中状态
            debouncedMessage("删除成功");
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // useEffect 的清理函数：组件卸载时移除事件监听器，防止内存泄漏。
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // 依赖项数组包含了所有在 effect 内部使用的外部变量，
    // 确保每次这些变量更新时，事件处理器都能拿到最新的值。
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
    ContainerList, // 虽然它是不变的，但作为最佳实践也应列入
  ]);
}
