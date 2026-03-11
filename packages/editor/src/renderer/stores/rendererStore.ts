/**
 * @file renderer/stores/rendererStore.ts
 * @description
 * Iframe (Renderer) 侧的 Store，是 Host Store 的只读副本。
 * 数据通过 postMessage 从 Host 同步而来。
 *
 * 重要：此 Store 不执行任何写操作——
 * 所有的状态变更都通过 SimulatorRenderer.dispatchAction 委托给 Host。
 *
 * @version 2.0
 * 新增：
 * - version 字段：与 Host 侧版本游标对齐，用于增量补丁校验
 * - applyComponentPatches：安全应用增量补丁
 */

import { create } from "zustand";
import { startTransition } from "react";
import { applyPatches, type Patch } from "immer";
import type { Component } from "@lowcode/schema";
import type { DragStartMetadataPayload } from "../../editor/simulator/protocol";

// ==================== State ====================

interface RendererState {
  /** 组件 Map（由 Host 同步而来） */
  components: Record<number, Component>;
  /** 根节点 ID */
  rootId: number;
  /** 版本游标，与 Host 侧对齐，用于增量补丁版本校验 */
  version: number;
  /** 当前选中的组件 ID */
  curComponentId: number | null;
  /** 编辑/预览模式 */
  mode: "edit" | "preview";
  /** 当前正在从主窗口拖入的物料元数据 */
  draggingMaterial: DragStartMetadataPayload | null;
}

// ==================== Actions ====================

interface RendererActions {
  /** 全量替换 components（由 Host SYNC_COMPONENTS_STATE 调用，附带 version 基准） */
  setComponentsState: (
    components: Record<number, Component>,
    rootId: number,
    version: number,
  ) => void;
  /** 增量应用补丁（由 Host SYNC_COMPONENTS_PATCH 调用） */
  applyComponentPatches: (patches: Patch[], version: number) => void;
  /** 同步 UI 状态（由 Host SYNC_UI_STATE 调用） */
  setUIState: (curComponentId: number | null, mode: "edit" | "preview") => void;
  /** 设置/清除拖拽中的物料元数据（由 Host DRAG_START_METADATA / DRAG_END 调用） */
  setDraggingMaterial: (data: DragStartMetadataPayload | null) => void;
  /** iframe 内部设置选中 ID（乐观更新） */
  setCurComponentId: (id: number | null) => void;
}

export type RendererStore = RendererState & RendererActions;

// ==================== Store 实例 ====================

export const useRendererStore = create<RendererStore>((set) => ({
  components: {},
  rootId: 1,
  version: 0,
  curComponentId: null,
  mode: "edit",
  draggingMaterial: null,

  setComponentsState: (components, rootId, version) => {
    startTransition(() => {
      set({ components, rootId, version });
    });
  },

  applyComponentPatches: (patches, version) => {
    startTransition(() => {
      set((state) => {
        const currentData = {
          components: state.components,
          rootId: state.rootId,
        };
        const patched = applyPatches(currentData, patches);
        return {
          components: patched.components,
          rootId: patched.rootId,
          version,
        };
      });
    });
  },

  setUIState: (curComponentId, mode) => {
    set({ curComponentId, mode });
  },

  setDraggingMaterial: (data) => {
    set({ draggingMaterial: data });
  },

  setCurComponentId: (id) => {
    set({ curComponentId: id });
  },
}));
