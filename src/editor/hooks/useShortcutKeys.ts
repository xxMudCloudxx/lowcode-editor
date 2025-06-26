// src/editor/hooks/useShortcutKeys.ts

import { useEffect, useMemo } from "react";
import { message } from "antd";
import { useComponetsStore } from "../stores/components";
import { useStore } from "zustand";
import { debounce } from "lodash-es";

// 这是一个独立的 Hook，不依赖任何 props
export function useShortcutKeys() {
  const {
    curComponentId,
    curComponent,
    copyComponents,
    pasteComponents,
    deleteComponent,
  } = useComponetsStore();

  const { undo, redo, pastStates, futureStates } = useStore(
    useComponetsStore.temporal
  );

  // 容器组件列表，用于智能粘贴
  const ContainerList: Set<string> = new Set([
    "Container",
    "Page",
    "Modal",
    "Table",
  ]);

  // 防抖版本的 message 函数，提升体验
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
      // 防止在输入框中触发快捷键
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

            const parentId = ContainerList.has(curComponent.name)
              ? curComponentId
              : curComponent.parentId;

            if (parentId) {
              pasteComponents(parentId);
            }

            debouncedMessage("粘贴成功");
          }
          break;

        // 撤销/重做
        case "z":
          if (isCmdOrCtrl && pastStates.length > 0 && !isShift) {
            e.preventDefault();
            undo();
            debouncedMessage("撤销成功");
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
    // 依赖项数组保持不变，确保函数能获取最新的状态
  }, [
    curComponent,
    curComponentId,
    copyComponents,
    pasteComponents,
    deleteComponent,
    undo,
    redo,
    pastStates,
    futureStates,
    debouncedMessage,
  ]);
}
