/**
 * @file /src/editor/stores/collaborationStore.ts
 * @description
 * 协同编辑状态管理 Store。
 * 管理编辑器模式、WebSocket 连接状态、页面 ID、协作者状态等。
 *
 * @module Stores/collaborationStore
 */

import { create } from "zustand";

/**
 * WebSocket 错误码
 * @see docs/RealtimeCollaboration/frontend-integration.md
 */
export type WSErrorCode =
  | "VERSION_CONFLICT"
  | "PATCH_INVALID"
  | "PATCH_FAILED"
  | "ROOM_NOT_FOUND"
  | "UNAUTHORIZED"
  | "PAGE_DELETED"
  | "INTERNAL_ERROR"
  | "DISCONNECTED";

/**
 * 错误遮罩配置
 */
export interface ErrorOverlay {
  code: WSErrorCode;
  message: string;
  /** 自动执行倒计时（秒），null 表示不自动执行 */
  countdown: number | null;
}

/**
 * 根据 userId 生成一个稳定的颜色
 * 与后端 Go 实现保持一致
 */
export function generateUserColor(userId: string): string {
  const colors = [
    "#FF6B6B", // 红色
    "#4ECDC4", // 青色
    "#45B7D1", // 蓝色
    "#96CEB4", // 绿色
    "#FFEAA7", // 黄色
    "#DDA0DD", // 梅红
    "#98D8C8", // 薄荷
    "#F7DC6F", // 金色
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = hash * 31 + userId.charCodeAt(i);
  }
  if (hash < 0) {
    hash = -hash;
  }

  return colors[hash % colors.length];
}

/**
 * 编辑器运行模式
 * - local: 本地模式，使用 LocalStorage
 * - live: 联机模式，使用 WebSocket 协同
 */
export type EditorMode = "local" | "live";

/**
 * 协作者信息
 * 描述一个远程协作用户的状态
 */
export interface Collaborator {
  userId: string;
  userName: string;
  avatarUrl?: string;
  color: string;
  /** 光标 X 坐标（相对于画布） */
  cursorX?: number;
  /** 光标 Y 坐标（相对于画布） */
  cursorY?: number;
  /** 选中的组件 ID */
  selectedComponentId?: string;
}

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
  /** 协作者数组（除自己外的其他用户） */
  collaborators: Collaborator[];
  /** 错误遮罩状态 */
  errorOverlay: ErrorOverlay | null;
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

  // ===== 协作者管理 =====
  /** 添加协作者（用户加入时） */
  addCollaborator: (collaborator: Collaborator) => void;
  /** 移除协作者（用户离开时） */
  removeCollaborator: (userId: string) => void;
  /** 更新协作者光标位置 */
  updateCollaboratorCursor: (
    userId: string,
    cursorX: number,
    cursorY: number
  ) => void;
  /** 更新协作者选中状态 */
  updateCollaboratorSelection: (
    userId: string,
    selectedComponentId: string | undefined
  ) => void;
  /** 批量设置协作者（sync 消息时） */
  setCollaborators: (collaborators: Collaborator[]) => void;
  /** 清空所有协作者 */
  clearCollaborators: () => void;
  /** 设置错误遮罩 */
  setErrorOverlay: (overlay: ErrorOverlay | null) => void;
}

const initialState: CollaborationState = {
  editorMode: "local",
  pageId: null,
  isConnected: false,
  connectionError: null,
  isPageLoading: false,
  serverVersion: 0,
  collaborators: [],
  errorOverlay: null,
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

  reset: () => set({ ...initialState, collaborators: [] }),

  // ===== 协作者管理实现（使用数组） =====
  addCollaborator: (collaborator) =>
    set((state) => {
      // 检查是否已存在
      const exists = state.collaborators.some(
        (c) => c.userId === collaborator.userId
      );
      if (exists) return state;
      return { collaborators: [...state.collaborators, collaborator] };
    }),

  removeCollaborator: (userId) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.userId !== userId),
    })),

  updateCollaboratorCursor: (userId, cursorX, cursorY) =>
    set((state) => {
      // 防御性检查
      if (!userId) {
        console.warn(
          "[CollabStore] updateCollaboratorCursor: userId is undefined"
        );
        return state;
      }

      const existingIndex = state.collaborators.findIndex(
        (c) => c.userId === userId
      );

      // -1, -1 表示隐藏光标
      const newCursorX = cursorX < 0 ? undefined : cursorX;
      const newCursorY = cursorY < 0 ? undefined : cursorY;

      if (existingIndex !== -1) {
        // 更新已存在的协作者
        return {
          collaborators: state.collaborators.map((c, i) =>
            i === existingIndex
              ? { ...c, cursorX: newCursorX, cursorY: newCursorY }
              : c
          ),
        };
      } else {
        // 创建新协作者（如果还不存在）
        return {
          collaborators: [
            ...state.collaborators,
            {
              userId,
              userName: userId.slice(0, 8), // 临时名称
              color: generateUserColor(userId),
              cursorX,
              cursorY,
            },
          ],
        };
      }
    }),

  updateCollaboratorSelection: (userId, selectedComponentId) =>
    set((state) => {
      // 防御性检查
      if (!userId) {
        console.warn(
          "[CollabStore] updateCollaboratorSelection: userId is undefined"
        );
        return state;
      }

      const existingIndex = state.collaborators.findIndex(
        (c) => c.userId === userId
      );
      if (existingIndex !== -1) {
        // 更新已存在的协作者
        return {
          collaborators: state.collaborators.map((c, i) =>
            i === existingIndex ? { ...c, selectedComponentId } : c
          ),
        };
      } else {
        // 创建新协作者（如果还不存在）
        return {
          collaborators: [
            ...state.collaborators,
            {
              userId,
              userName: userId.slice(0, 8), // 临时名称
              color: generateUserColor(userId),
              selectedComponentId,
            },
          ],
        };
      }
    }),

  setCollaborators: (collaborators) => set({ collaborators }),

  clearCollaborators: () => set({ collaborators: [] }),

  setErrorOverlay: (overlay) => set({ errorOverlay: overlay }),
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

/**
 * 便捷选择器：获取协作者列表
 * 直接返回数组，避免转换导致无限循环
 */
export const useCollaborators = () =>
  useCollaborationStore((s) => s.collaborators);
