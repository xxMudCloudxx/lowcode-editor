/**
 * @file /src/editor/stores/uiStore.ts
 * @description
 * 专门管理瞬时 UI 状态的 Store：
 * - 当前选中的组件 id（curComponentId）
 * - 编辑 / 预览模式（mode）
 * - 画布尺寸（canvasSize）- 同步状态，所有协作者一致
 * - 本地缩放比例（localScale）- 本地状态，每用户独立
 * - 复制 / 粘贴用的剪切板（clipboard，仍然是树状结构）
 *
 * 仅使用 immer 中间件，不接入 temporal 或 persist，
 * 避免这些纯 UI 状态进入撤销 / 重做或本地持久化。
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ComponentTree } from "../interface";

// ===== 画布尺寸类型 =====

export type CanvasMode = "mobile" | "tablet" | "desktop";

export interface CanvasSize {
  width: number | "100%";
  height: number | "auto";
  mode: CanvasMode;
}

/** 画布尺寸预设 */
export const CANVAS_PRESETS: Record<CanvasMode, CanvasSize> = {
  mobile: { width: 375, height: 667, mode: "mobile" },
  tablet: { width: 768, height: 1024, mode: "tablet" },
  // Desktop 默认 "100%"，首次进入时会自动取 EditArea 容器宽度并转为固定像素值
  desktop: { width: "100%", height: "auto", mode: "desktop" },
} as const;

// ===== Store 类型定义 =====

interface UIState {
  curComponentId: number | null;
  mode: "edit" | "preview";
  canvasSize: CanvasSize;
  /**
   * 本地缩放比例 - 每用户独立控制
   * 默认 1 (100%)，用户可通过 zoomIn/zoomOut 调整
   */
  localScale: number;
  // 剪切板仍使用树状结构，方便 regenerateIds 做递归处理
  clipboard: ComponentTree | null;
}

interface UIActions {
  setCurComponentId: (id: number | null) => void;
  setMode: (mode: UIState["mode"]) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setCanvasPreset: (preset: CanvasMode) => void;
  setClipboard: (component: ComponentTree | null) => void;
  /** 设置本地缩放比例 */
  setLocalScale: (scale: number) => void;
  /** 放大 (+10%) */
  zoomIn: () => void;
  /** 缩小 (-10%) */
  zoomOut: () => void;
  /** 重置为 100% */
  resetZoom: () => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    curComponentId: null,
    mode: "edit",
    canvasSize: CANVAS_PRESETS.desktop, // 默认桌面模式
    localScale: 1, // 默认缩放比例 100%
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

    setCanvasSize: (size) => {
      set((state) => {
        state.curComponentId = null;
        state.canvasSize = size;
      });
    },

    setCanvasPreset: (preset) => {
      set((state) => {
        state.curComponentId = null;
        state.canvasSize = CANVAS_PRESETS[preset];
      });
    },

    setClipboard: (component) => {
      set((state) => {
        state.clipboard = component;
      });
    },

    setLocalScale: (scale) => {
      set((state) => {
        // 限制范围 10% - 300%
        state.localScale = Math.max(0.1, Math.min(3, scale));
      });
    },

    zoomIn: () => {
      set((state) => {
        state.localScale = Math.min(3, state.localScale + 0.1);
      });
    },

    zoomOut: () => {
      set((state) => {
        state.localScale = Math.max(0.1, state.localScale - 0.1);
      });
    },

    resetZoom: () => {
      set((state) => {
        state.localScale = 1;
      });
    },
  }))
);
