/**
 * @file /src/editor/hooks/useShortcutKeys.ts
 * @description
 * 集中管理和处理编辑器全局快捷键的自定义 Hook。
 * 封装了 `keydown` 事件监听、快捷键组合判断（如 Cmd/Ctrl + C）
 * 以及触发对应的 Zustand store actions（复制、粘贴、撤销、重做、删除）。
 * @module Hooks/useShortcutKeys
 */

import { useEffect, useMemo } from "react";
import { message } from "antd";
import { useComponentsStore, getComponentById } from "../stores/components";
import { useUIStore } from "../stores/uiStore";
import { useHistoryStore } from "../stores/historyStore";
import type { Component, ComponentTree } from "@lowcode/schema";
import { debounce } from "lodash-es";

// 容器组件列表，用于智能粘贴时判断粘贴目标
const ContainerList: Set<string> = new Set([
  "Container",
  "Page",
  "Modal",
  "Table",
]);

/**
 * 为编辑器提供全局快捷键功能的 Hook。
 * 在顶层组件中调用一次即可生效。
 */
export function useShortcutKeys() {
  const { components, pasteComponents, deleteComponent } = useComponentsStore();

  // history store 中的撤销 / 重做能力
  const { undo, redo, past, future } = useHistoryStore();

  const { curComponentId, setCurComponentId, setClipboard } = useUIStore();

  // UI 层按需派生当前选中组件，避免在 store 中冗余存储快照
  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components],
  );

  // 使用 debounce 创建一个防抖版 message 函数
  const debouncedMessage = useMemo(
    () =>
      debounce((text: string) => {
        message.success(text);
      }, 300),
    [],
  );

  useEffect(() => {
    /**
     * 全局键盘事件处理器
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

            const tree = buildClipboardTree(curComponentId, components);
            if (tree) {
              setClipboard(tree);
              debouncedMessage("复制成功");
            }
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
          if (isCmdOrCtrl && past.length > 0 && !isShift) {
            e.preventDefault();
            undo();
            debouncedMessage("撤销成功");
            // 重做：Cmd/Ctrl + Shift + Z
          } else if (isCmdOrCtrl && isShift && future.length > 0) {
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
    components,
    curComponent,
    curComponentId,
    pasteComponents,
    deleteComponent,
    setCurComponentId,
    setClipboard,
    undo,
    redo,
    past,
    future,
    debouncedMessage,
  ]);
}

/**
 * @description
 * 从范式化的 components Map 中构建以指定组件为根节点的树状结构，
 * 用于剪切板（clipboard）存储。
 */
function buildClipboardTree(
  id: number,
  components: Record<number, Component>,
): ComponentTree | null {
  const node = components[id];
  if (!node) return null;

  const children =
    node.children && node.children.length > 0
      ? (node.children
          .map((childId) => buildClipboardTree(childId, components))
          .filter(Boolean) as ComponentTree[])
      : undefined;

  return {
    id: node.id,
    name: node.name,
    props: node.props,
    desc: node.desc,
    parentId: node.parentId,
    children,
    styles: node.styles,
  };
}
