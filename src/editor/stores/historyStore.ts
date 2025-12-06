/**
 * @file /src/editor/stores/historyStore.ts
 * @description
 * 增量补丁历史管理 Store。
 * 负责存储操作历史（patches），并提供撤销/重做功能。
 *
 * @security 使用 immer 的 applyPatches 安全地应用补丁。
 *
 * @collaboration
 * 为未来实时协同编辑预留了接口：
 * - isApplyingPatches: 阻止 undo/redo 操作被记录
 * - isApplyingRemotePatch: 阻止远程用户的操作进入本地撤销栈
 * - applyRemotePatch(): 安全应用来自服务器的补丁
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  /** 标志位：当为 true 时，undoMiddleware 不记录本次变更（用于 undo/redo） */
  isApplyingPatches: boolean;
  /**
   * 标志位：当为 true 时，正在应用来自远程协同者的补丁
   * @collaboration 未来 WebSocket 接收补丁时使用
   */
  isApplyingRemotePatch: boolean;
}

interface HistoryAction {
  addPatch: (patches: Patch[], inversePatches: Patch[]) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setApplyingPatches: (value: boolean) => void;
  setApplyingRemotePatch: (value: boolean) => void;
  applyRemotePatch: (patches: Patch[]) => Promise<void>;
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

export const useHistoryStore = create<HistoryState & HistoryAction>()(
  persist(
    (set, get) => ({
      past: [],
      future: [],
      isApplyingPatches: false,
      isApplyingRemotePatch: false,

      setApplyingPatches: (value) => {
        set({ isApplyingPatches: value });
      },

      setApplyingRemotePatch: (value) => {
        set({ isApplyingRemotePatch: value });
      },

      addPatch: (patches, inversePatches) => {
        if (get().isApplyingPatches) return;
        if (get().isApplyingRemotePatch) return;
        if (patches.length === 0 && inversePatches.length === 0) return;

        set((state) => ({
          past: [...state.past, { patches, inversePatches }],
          future: [],
        }));
      },

      applyRemotePatch: async (patches) => {
        if (patches.length === 0) return;

        set({ isApplyingRemotePatch: true });

        try {
          const useComponentsStore = await getComponentsStore();
          useComponentsStore.setState((state) => {
            const currentData = {
              components: state.components,
              rootId: state.rootId,
            };
            const patched = applyPatches(currentData, patches);
            return {
              ...state,
              components: patched.components,
              rootId: patched.rootId,
            };
          });
        } finally {
          set({ isApplyingRemotePatch: false });
        }
      },

      undo: async () => {
        const { past, future } = get();
        if (past.length === 0) return;

        const lastPatchGroup = past[past.length - 1];
        const newPast = past.slice(0, -1);

        set({ isApplyingPatches: true });

        try {
          const useComponentsStore = await getComponentsStore();
          useComponentsStore.setState((state) => {
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

        set({ isApplyingPatches: true });

        try {
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
    }),
    {
      name: "lowcode-history",
      // 只持久化 past 和 future，不持久化临时标志位
      partialize: (state) => ({
        past: state.past,
        future: state.future,
      }),
    }
  )
);
