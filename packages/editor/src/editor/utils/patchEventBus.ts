/**
 * @file /src/editor/utils/patchEventBus.ts
 * @description
 * 极简的 Pub/Sub 事件总线，用于解耦 Zustand 中间件与 SimulatorHost。
 * 仅负责转播 PATCH_GENERATED 事件——当 components store 产生增量补丁时，
 * 由 undoMiddleware（或 historyStore）emit，由 SimulatorHost subscribe 消费。
 *
 * 设计原则：
 * - 单一职责：只传递 PatchEvent，不做任何业务逻辑
 * - 零依赖：不引用任何 store 或 simulator 模块
 * - 同步广播：emit 时同步调用所有 listener
 */

import type { Patch } from "immer";

/**
 * 补丁事件载荷
 */
export interface PatchEvent {
  /** 实际的数据补丁（已剔除 version 路径的补丁） */
  patches: Patch[];
  /** 此补丁基于的版本号（应用前的 version） */
  baseVersion: number;
  /** 应用补丁后的版本号 */
  currentVersion: number;
}

type PatchEventListener = (event: PatchEvent) => void;

class PatchEventBus {
  private listeners: Set<PatchEventListener> = new Set();

  /**
   * 订阅补丁事件
   * @returns 取消订阅的函数
   */
  subscribe(listener: PatchEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 发布补丁事件，同步通知所有订阅者
   */
  emit(event: PatchEvent): void {
    if (event.patches.length === 0) return; // 空补丁不广播
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("[PatchEventBus] Listener error:", err);
      }
    });
  }

  /**
   * 清除所有订阅者（用于测试或销毁）
   */
  clear(): void {
    this.listeners.clear();
  }
}

/** 全局单例 */
export const patchEventBus = new PatchEventBus();
