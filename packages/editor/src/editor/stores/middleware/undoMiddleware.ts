/**
 * @file /src/editor/stores/middleware/undoMiddleware.ts
 * @description
 * Zustand 中间件：拦截 set() 调用，使用 immer 的 produceWithPatches 捕获变更补丁。
 * 补丁会自动记录到 historyStore，用于撤销/重做功能。
 *
 * @version 2.0
 * 新增职责：
 * - 在 produceWithPatches 中注入 version 递增
 * - 从 patches/inversePatches 中剔除 version 路径的补丁
 * - 通过 patchEventBus 广播净化后的补丁，供 SimulatorHost 消费
 *
 * @collaboration
 * 支持区分本地操作与远程操作：
 * - isApplyingPatches: undo/redo 时不记录
 * - isApplyingRemotePatch: 远程协同补丁不记录到本地历史
 *
 * 这确保了用户 A 撤销时，不会撤销用户 B 的操作。
 */

import type { StateCreator } from "zustand";
import { produceWithPatches, enablePatches, type Patch } from "immer";
import { useHistoryStore } from "../historyStore";
import { patchEventBus } from "../../utils/patchEventBus";

// 启用 Immer patches 功能
enablePatches();

/**
 * 判断一个 Patch 是否修改的是 version 路径
 */
const isVersionPatch = (p: Patch): boolean => p.path[0] === "version";

/**
 * undoMiddleware: 包装 set 函数，捕获 immer 变更并记录 patches
 *
 * @description
 * 工作原理：
 * 1. 拦截所有 set() 调用
 * 2. 如果是函数式更新，使用 produceWithPatches 生成补丁
 * 3. 在 draft 中注入 version 递增（保证每次变更都推进版本游标）
 * 4. 从 patches/inversePatches 中剔除 version 路径的补丁（纯数据补丁）
 * 5. 检查标志位，决定是否记录到历史
 * 6. 通过 patchEventBus 广播净化后的补丁
 * 7. 应用新状态
 *
 * @important
 * Zustand 的 set 是同步的，因此在 wrappedSet 内部 get() 始终能拿到最新状态，
 * 不存在 version 竞态问题。此假设基于 JS 单线程执行模型。
 *
 * @collaboration
 * 标志位检查逻辑：
 * - isApplyingPatches = true → 跳过记录（undo/redo 触发的）
 * - isApplyingRemotePatch = true → 跳过记录（远程协同触发的）
 * - 两者都为 false → 记录（本地用户操作）
 */
export const undoMiddleware =
  <T extends object>(
    initializer: StateCreator<T, [], []>,
  ): StateCreator<T, [], []> =>
  (set, get, api) => {
    // 包装后的 set 函数
    const wrappedSet = (partial: any, replace?: boolean) => {
      const currentState = get();

      // 只处理函数式更新（Immer producer style）
      if (typeof partial === "function") {
        try {
          // 获取历史状态标志位
          const historyState = useHistoryStore.getState();
          const isApplyingPatches = historyState.isApplyingPatches;
          const isApplyingRemotePatch = historyState.isApplyingRemotePatch;

          // 读取当前版本号作为基线
          const baseVersion = (currentState as any).version ?? 0;

          const [nextState, patches, inversePatches] = produceWithPatches(
            currentState as object,
            (draft: any) => {
              // 先执行业务逻辑
              partial(draft);
              // 注入版本递增
              draft.version = baseVersion + 1;
            },
          );

          // 从补丁中剔除 version 路径的补丁，得到纯数据补丁
          const actualPatches = patches.filter((p) => !isVersionPatch(p));
          const actualInversePatches = inversePatches.filter(
            (p) => !isVersionPatch(p),
          );

          // 只有在以下条件都满足时才记录补丁：
          // 1. 不是 undo/redo 过程
          // 2. 不是远程协同补丁
          // 3. 有实际变更
          const shouldRecordPatch =
            !isApplyingPatches &&
            !isApplyingRemotePatch &&
            actualPatches.length > 0;

          if (shouldRecordPatch) {
            useHistoryStore
              .getState()
              .addPatch(actualPatches, actualInversePatches);
          }

          // 广播净化后的补丁到 EventBus（供 SimulatorHost 消费）
          // 无论是否记录历史，只要有实际数据变更都要广播给 iframe
          if (actualPatches.length > 0) {
            patchEventBus.emit({
              patches: actualPatches,
              baseVersion,
              currentVersion: baseVersion + 1,
            });
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
