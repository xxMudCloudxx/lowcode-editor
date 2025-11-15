/**
 * @file /src/editor/stores/uiStore.ts
 * @description
 * 专门管理瞬时 UI 状态的 Store：
 * - 当前选中的组件 id（curComponentId）
 * - 编辑 / 预览模式（mode）
 * - 复制 / 粘贴用的剪切板（clipboard，仍然是树状结构）
 *
 * 仅使用 immer 中间件，不接入 temporal 或 persist，
 * 避免这些纯 UI 状态进入撤销 / 重做或本地持久化。
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ComponentTree } from "../interface";

interface UIState {
  curComponentId: number | null;
  mode: "edit" | "preview";
  // 剪切板仍使用树状结构，方便 regenerateIds 做递归处理
  clipboard: ComponentTree | null;
}

interface UIActions {
  setCurComponentId: (id: number | null) => void;
  setMode: (mode: UIState["mode"]) => void;
  setClipboard: (component: ComponentTree | null) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    curComponentId: null,
    mode: "edit",
    clipboard: null,

    setCurComponentId: (id) => {
      set((state) => {
        state.curComponentId = id;
      });
    },

    setMode: (mode) => {
      set((state) => {
        state.mode = mode;
      });
    },

    setClipboard: (component) => {
      set((state) => {
        state.clipboard = component;
      });
    },
  }))
);

