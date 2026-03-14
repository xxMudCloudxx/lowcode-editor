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
import { applyPatches, type Patch } from "immer";
import { patchEventBus } from "../utils/patchEventBus";

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
  /** 设置是否正在应用补丁（供 undo/redo 调用） */
  setApplyingPatches: (value: boolean) => void;
  /** 设置是否正在应用远程补丁（供 WebSocket handler 调用） */
  setApplyingRemotePatch: (value: boolean) => void;
  /**
   * 应用来自远程协同者的补丁
   * 会设置 isApplyingRemotePatch = true，确保不污染本地撤销栈
   * @collaboration 未来 WebSocket 接收消息时调用此方法
   */
  applyRemotePatch: (patches: Patch[]) => Promise<void>;
}

const HISTORY_STORAGE_KEY = "lowcode-history";
const MAX_HISTORY_STEPS = 50;

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

const clearLegacyHistoryStorage = () => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures to keep the history store usable.
  }
};

clearLegacyHistoryStorage();

export const useHistoryStore = create<HistoryState & HistoryAction>()(
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
        past: [
          ...state.past.slice(-(MAX_HISTORY_STEPS - 1)),
          { patches, inversePatches },
        ],
        future: [], // 新操作会清空 future
      }));
    },

    /**
     * 应用来自远程协同者的补丁
     * 确保不会进入本地撤销栈
     *
     * @example
     * // WebSocket 消息处理
     * socket.on('remote_patch', (patches) => {
     *   useHistoryStore.getState().applyRemotePatch(patches);
     * });
     */
    applyRemotePatch: async (patches) => {
      if (patches.length === 0) return;

      set({ isApplyingRemotePatch: true });

      try {
        const useComponentsStore = await getComponentsStore();
        const baseVersion = useComponentsStore.getState().version ?? 0;

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
            version: baseVersion + 1,
          };
        });

        // 广播远程补丁到 iframe
        patchEventBus.emit({
          patches,
          baseVersion,
          currentVersion: baseVersion + 1,
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
        const baseVersion = useComponentsStore.getState().version ?? 0;

        useComponentsStore.setState((state) => {
          // 只对 components 和 rootId 应用补丁
          const currentData = {
            components: state.components,
            rootId: state.rootId,
          };
          const patched = applyPatches(
            currentData,
            lastPatchGroup.inversePatches,
          );
          return {
            ...state,
            components: patched.components,
            rootId: patched.rootId,
            version: baseVersion + 1,
          };
        });

        // 广播 undo 产生的逆向补丁到 iframe
        patchEventBus.emit({
          patches: lastPatchGroup.inversePatches,
          baseVersion,
          currentVersion: baseVersion + 1,
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

      set({ isApplyingPatches: true });

      try {
        const useComponentsStore = await getComponentsStore();
        const baseVersion = useComponentsStore.getState().version ?? 0;

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
            version: baseVersion + 1,
          };
        });

        // 广播 redo 产生的正向补丁到 iframe
        patchEventBus.emit({
          patches: nextPatchGroup.patches,
          baseVersion,
          currentVersion: baseVersion + 1,
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
      clearLegacyHistoryStorage();
      set({ past: [], future: [] });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  }),
);
