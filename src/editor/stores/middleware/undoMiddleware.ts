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
 *
 * @patchEmitter
 * 支持通过 setPatchEmitter 注册回调函数，当有新的本地变更时：
 * 1. 生成 RFC 6902 JSON Patch 格式的补丁
 * 2. 调用注册的回调函数（例如发送到 WebSocket）
 * 3. 开发模式下自动输出日志，便于测试
 */

import type { StateCreator } from "zustand";
import type { Patch } from "immer";
import { produceWithPatches, enablePatches } from "immer";
import { useHistoryStore } from "../historyStore";

// 启用 Immer patches 功能
enablePatches();

/**
 * RFC 6902 JSON Patch 操作类型
 * @see https://datatracker.ietf.org/doc/html/rfc6902
 */
export interface JSONPatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

/**
 * Patch 发射器回调类型
 * 当本地操作产生 patches 时调用
 */
export type PatchEmitter = (patches: JSONPatchOp[]) => void;

/**
 * 全局 patch 发射器实例
 * 可通过 setPatchEmitter 设置
 */
let patchEmitter: PatchEmitter | null = null;

/**
 * 开发日志开关
 * Vite 使用 import.meta.env.DEV 检测开发模式
 */
let enablePatchLogging = import.meta.env?.DEV ?? true;

/**
 * 设置 Patch 发射器回调
 * 用于 WebSocket 集成，当本地操作产生 patches 时调用此回调
 *
 * @example
 * ```typescript
 * // 在 WebSocket 连接建立后设置
 * import { setPatchEmitter } from './undoMiddleware';
 *
 * const socket = new WebSocket('ws://...');
 * setPatchEmitter((patches) => {
 *   socket.send(JSON.stringify({
 *     type: 'op-patch',
 *     senderId: 'user_xxx',
 *     payload: { patches, version: currentVersion },
 *     ts: Date.now()
 *   }));
 * });
 *
 * // 断开连接时清除
 * setPatchEmitter(null);
 * ```
 */
export function setPatchEmitter(emitter: PatchEmitter | null): void {
  patchEmitter = emitter;
}

/**
 * 启用/禁用 Patch 日志输出
 * @param enable 是否启用日志
 */
export function setEnablePatchLogging(enable: boolean): void {
  enablePatchLogging = enable;
}

/**
 * 将 Immer Patch 转换为 RFC 6902 JSON Patch 格式
 *
 * Immer Patch 格式:
 * { op: 'replace', path: ['components', 1, 'desc'], value: '新描述' }
 *
 * RFC 6902 JSON Patch 格式:
 * { op: 'replace', path: '/components/1/desc', value: '新描述' }
 *
 * @param immerPatches Immer 生成的 patches 数组
 * @returns RFC 6902 格式的 JSON Patch 数组
 */
export function convertToJSONPatch(immerPatches: Patch[]): JSONPatchOp[] {
  return immerPatches.map((patch) => {
    // 将 path 数组转换为 JSON Pointer 格式
    // ['components', 1, 'desc'] -> '/components/1/desc'
    const path =
      "/" +
      patch.path
        .map((segment) => {
          // RFC 6901: JSON Pointer 需要对 '~' 和 '/' 进行转义
          const str = String(segment);
          return str.replace(/~/g, "~0").replace(/\//g, "~1");
        })
        .join("/");

    const result: JSONPatchOp = {
      op: patch.op as JSONPatchOp["op"],
      path,
    };

    // add 和 replace 需要 value
    if (patch.op === "add" || patch.op === "replace") {
      result.value = patch.value;
    }

    return result;
  });
}

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
            // 记录到历史栈（用于 undo/redo）
            useHistoryStore.getState().addPatch(patches, inversePatches);

            // 转换为 RFC 6902 JSON Patch 格式
            const jsonPatches = convertToJSONPatch(patches);

            // 开发模式下输出日志（便于前端团队测试）
            if (enablePatchLogging) {
              console.log(
                "%c[Patch] RFC 6902 JSON Patch:",
                "color: #4CAF50; font-weight: bold;"
              );
              console.log(JSON.stringify(jsonPatches, null, 2));
            }

            // 调用 patch 发射器（例如发送到 WebSocket）
            if (patchEmitter) {
              try {
                patchEmitter(jsonPatches);
              } catch (error) {
                console.error("[undoMiddleware] Error in patchEmitter:", error);
              }
            }
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
