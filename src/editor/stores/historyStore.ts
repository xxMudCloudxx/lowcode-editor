/**
 * @file /src/editor/stores/historyStore.ts
 * @description
 * 增量补丁历史管理 Store。
 * 负责存储操作历史（patches），并提供撤销/重做功能。
 *
 * @security 使用 immer 的 applyPatches 安全地应用补丁。
 */

import { create } from "zustand";
import { applyPatches, type Patch } from "immer";

/**
 * 一组补丁：包含正向补丁（用于 redo）和逆向补丁（用于 undo）
 */
export interface PatchGroup {
  patches: Patch[];
  inversePatches: Patch[];
}

interface HistoryState {
  past: PatchGroup[];
  future: PatchGroup[];
  /** 标志位：当为 true 时，undoMiddleware 不记录本次变更 */
  isApplyingPatches: boolean;
}

interface HistoryAction {
  addPatch: (patches: Patch[], inversePatches: Patch[]) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** 设置是否正在应用补丁（供 middleware 调用） */
  setApplyingPatches: (value: boolean) => void;
}

/**
 * 延迟导入 useComponentsStore 避免循环依赖
 */
let componentsStoreModule: typeof import("./components") | null = null;

const getComponentsStore = async () => {
  if (!componentsStoreModule) {
    componentsStoreModule = await import("./components");
  }
  return componentsStoreModule.useComponentsStore;
};

export const useHistoryStore = create<HistoryState & HistoryAction>(
  (set, get) => ({
    past: [],
    future: [],
    isApplyingPatches: false,

    setApplyingPatches: (value) => {
      set({ isApplyingPatches: value });
    },

    addPatch: (patches, inversePatches) => {
      // 如果正在应用补丁（undo/redo 过程中），跳过记录
      if (get().isApplyingPatches) return;
      // 空补丁不记录
      if (patches.length === 0 && inversePatches.length === 0) return;

      set((state) => ({
        past: [...state.past, { patches, inversePatches }],
        future: [], // 新操作会清空 future
      }));
    },

    undo: async () => {
      const { past, future } = get();
      if (past.length === 0) return;

      const lastPatchGroup = past[past.length - 1];
      const newPast = past.slice(0, -1);

      // 标记正在应用补丁，防止 middleware 再次记录
      set({ isApplyingPatches: true });

      try {
        // 获取 components store 并应用逆向补丁
        const useComponentsStore = await getComponentsStore();
        useComponentsStore.setState((state) => {
          // 只对 components 和 rootId 应用补丁
          const currentData = {
            components: state.components,
            rootId: state.rootId,
          };
          const patched = applyPatches(
            currentData,
            lastPatchGroup.inversePatches
          );
          return {
            ...state,
            components: patched.components,
            rootId: patched.rootId,
          };
        });

        // 更新历史栈
        set({
          past: newPast,
          future: [lastPatchGroup, ...future],
        });
      } finally {
        set({ isApplyingPatches: false });
      }
    },

    redo: async () => {
      const { past, future } = get();
      if (future.length === 0) return;

      const nextPatchGroup = future[0];
      const newFuture = future.slice(1);

      // 标记正在应用补丁
      set({ isApplyingPatches: true });

      try {
        // 获取 components store 并应用正向补丁
        const useComponentsStore = await getComponentsStore();
        useComponentsStore.setState((state) => {
          const currentData = {
            components: state.components,
            rootId: state.rootId,
          };
          const patched = applyPatches(currentData, nextPatchGroup.patches);
          return {
            ...state,
            components: patched.components,
            rootId: patched.rootId,
          };
        });

        // 更新历史栈
        set({
          past: [...past, nextPatchGroup],
          future: newFuture,
        });
      } finally {
        set({ isApplyingPatches: false });
      }
    },

    clear: () => {
      set({ past: [], future: [] });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  })
);
