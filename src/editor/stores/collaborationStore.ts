/**
 * @file /src/editor/stores/collaborationStore.ts
 * @description
 * 协同编辑状态管理 Store。
 * 管理编辑器模式、WebSocket 连接状态、页面 ID 等协同相关状态。
 *
 * @module Stores/collaborationStore
 */

import { create } from "zustand";

/**
 * 编辑器运行模式
 * - local: 本地模式，使用 LocalStorage
 * - live: 联机模式，使用 WebSocket 协同
 */
export type EditorMode = "local" | "live";

interface CollaborationState {
  /** 编辑器运行模式 */
  editorMode: EditorMode;
  /** 当前页面 ID（联机模式下有值） */
  pageId: string | null;
  /** WebSocket 是否已连接 */
  isConnected: boolean;
  /** 连接错误信息 */
  connectionError: string | null;
  /** 页面是否正在加载 */
  isPageLoading: boolean;
  /** 当前服务端版本号 */
  serverVersion: number;
}

interface CollaborationActions {
  /** 设置编辑器模式 */
  setEditorMode: (mode: EditorMode) => void;
  /** 设置页面 ID */
  setPageId: (pageId: string | null) => void;
  /** 设置连接状态 */
  setConnected: (connected: boolean) => void;
  /** 设置连接错误 */
  setConnectionError: (error: string | null) => void;
  /** 设置页面加载状态 */
  setPageLoading: (loading: boolean) => void;
  /** 设置服务端版本号 */
  setServerVersion: (version: number) => void;
  /** 重置协同状态 */
  reset: () => void;
}

const initialState: CollaborationState = {
  editorMode: "local",
  pageId: null,
  isConnected: false,
  connectionError: null,
  isPageLoading: false,
  serverVersion: 0,
};

export const useCollaborationStore = create<
  CollaborationState & CollaborationActions
>()((set) => ({
  ...initialState,

  setEditorMode: (mode) => set({ editorMode: mode }),
  setPageId: (pageId) => set({ pageId }),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),
  setPageLoading: (loading) => set({ isPageLoading: loading }),
  setServerVersion: (version) => set({ serverVersion: version }),

  reset: () => set(initialState),
}));

/**
 * 便捷选择器：是否为联机模式
 */
export const useIsLiveMode = () =>
  useCollaborationStore((s) => s.editorMode === "live");

/**
 * 便捷选择器：是否已连接
 */
export const useIsConnected = () => useCollaborationStore((s) => s.isConnected);
