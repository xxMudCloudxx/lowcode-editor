/**
 * @file /src/editor/stores/middleware/undoMiddleware.ts
 * @description
 * Zustand 中间件：拦截 set() 调用，使用 immer 的 produceWithPatches 捕获变更补丁。
 * 补丁会自动记录到 historyStore，用于撤销/重做功能。
 *
 * @collaboration
 * 支持区分本地操作与远程操作：
 * - isApplyingPatches: undo/redo 时不记录
 * - isApplyingRemotePatch: 远程协同补丁不记录到本地历史
 *
 * 这确保了用户 A 撤销时，不会撤销用户 B 的操作。
 */

import type { StateCreator } from "zustand";
import { produceWithPatches, enablePatches } from "immer";
import { useHistoryStore } from "../historyStore";

// 启用 Immer patches 功能
enablePatches();

/**
 * undoMiddleware: 包装 set 函数，捕获 immer 变更并记录 patches
 *
 * @description
 * 工作原理：
 * 1. 拦截所有 set() 调用
 * 2. 如果是函数式更新，使用 produceWithPatches 生成补丁
 * 3. 检查标志位，决定是否记录到历史
 * 4. 应用新状态
 *
 * @collaboration
 * 标志位检查逻辑：
 * - isApplyingPatches = true → 跳过（undo/redo 触发的）
 * - isApplyingRemotePatch = true → 跳过（远程协同触发的）
 * - 两者都为 false → 记录（本地用户操作）
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
          // 获取历史状态
          const historyState = useHistoryStore.getState();
          const isApplyingPatches = historyState.isApplyingPatches;
          const isApplyingRemotePatch = historyState.isApplyingRemotePatch;

          const [nextState, patches, inversePatches] = produceWithPatches(
            currentState as object,
            partial
          );

          // 只有在以下条件都满足时才记录补丁：
          // 1. 不是 undo/redo 过程
          // 2. 不是远程协同补丁
          // 3. 有实际变更
          const shouldRecordPatch =
            !isApplyingPatches && !isApplyingRemotePatch && patches.length > 0;

          if (shouldRecordPatch) {
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
        // 非函数式更新直接透传（初始化、persist 恢复等）
        (set as any)(partial, replace);
      }
    };

    // 用包装后的 set 调用 initializer
    return initializer(wrappedSet as typeof set, get, api);
  };
