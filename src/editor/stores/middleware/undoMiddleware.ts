/**
 * @file /src/editor/stores/middleware/undoMiddleware.ts
 * @description
 * Zustand 中间件：拦截 set() 调用，使用 immer 的 produceWithPatches 捕获变更补丁。
 * 补丁会自动记录到 historyStore，用于撤销/重做功能。
 */

import type { StateCreator } from "zustand";
import { produceWithPatches, enablePatches } from "immer";
import { useHistoryStore } from "../historyStore";

// 启用 Immer patches 功能
enablePatches();

/**
 * undoMiddleware: 包装 set 函数，捕获 immer 变更并记录 patches
 * 使用 any 类型简化泛型处理，避免复杂的类型推导问题
 */
export const undoMiddleware =
  <T extends object>(
    initializer: StateCreator<T, [], []>
  ): StateCreator<T, [], []> =>
  (set, get, api) => {
    // 包装后的 set 函数
    const wrappedSet = (partial: any, replace?: boolean) => {
      const currentState = get();

      // 只处理函数式更新（Immer producer style）
      if (typeof partial === "function") {
        try {
          const isApplyingPatches =
            useHistoryStore.getState().isApplyingPatches;

          const [nextState, patches, inversePatches] = produceWithPatches(
            currentState as object,
            partial
          );

          // 只有在非 undo/redo 过程中且有实际变更时才记录补丁
          if (!isApplyingPatches && patches.length > 0) {
            useHistoryStore.getState().addPatch(patches, inversePatches);
          }

          // 使用原始 set 应用新状态
          (set as any)(nextState, replace);
        } catch (error) {
          console.error("[undoMiddleware] Error in produceWithPatches:", error);
          // 降级：直接使用原始方式
          (set as any)(partial, replace);
        }
      } else {
        // 非函数式更新直接透传
        (set as any)(partial, replace);
      }
    };

    // 用包装后的 set 调用 initializer
    return initializer(wrappedSet as typeof set, get, api);
  };
