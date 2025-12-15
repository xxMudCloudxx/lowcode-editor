/**
 * @file /src/editor/hooks/useCollaboration.ts
 * @description
 * WebSocket 协同编辑 Hook。
 * 管理与后端的 WebSocket 连接、消息收发、自动重连。
 *
 * 核心功能：
 * - 本地操作通过 setPatchEmitter 发送到 WebSocket
 * - 远程操作通过 applyRemotePatch 应用，不触发二次发送
 * - 协作者光标和选中状态同步
 * - 防御性更新，静默忽略失败的 patch
 *
 * @module Hooks/useCollaboration
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { message } from "antd";
import { throttle } from "lodash-es";
import { useHistoryStore } from "../stores/historyStore";
import { useComponentsStore } from "../stores/components";
import {
  useCollaborationStore,
  type Collaborator,
  generateUserColor,
} from "../stores/collaborationStore";
import { useUIStore } from "../stores/uiStore";
import {
  setPatchEmitter,
  type JSONPatchOp,
} from "../stores/middleware/undoMiddleware";
import type { Patch } from "immer";

/**
 * WebSocket 消息类型定义
 * @see docs/RealtimeCollaboration/frontend-integration.md
 */
interface WSMessage {
  type:
    | "op-patch"
    | "cursor-move"
    | "user-join"
    | "user-leave"
    | "sync"
    | "ack"
    | "selection-change"
    | "error";
  senderId: string;
  payload: unknown;
  ts: number;
}

/**
 * Sync 消息中的用户状态
 */
interface SyncUserState {
  cursorX?: number;
  cursorY?: number;
  selectedComponentId?: string;
}

/**
 * Sync 消息中的用户信息
 */
interface SyncUserInfo {
  userId: string;
  userName: string;
  avatarUrl?: string;
  color?: string;
  state?: SyncUserState;
}

/**
 * Sync 消息的 payload 结构
 */
interface SyncPayload {
  schema: {
    components: Record<string, unknown>;
    rootId: number;
  };
  version: number;
  users: SyncUserInfo[];
}

/**
 * op-patch 消息的 payload 结构（从其他用户接收）
 */
interface OpPatchPayload {
  patches: JSONPatchOp[];
  version: number;
}

/**
 * user-join 消息的 payload 结构
 */
interface UserJoinPayload {
  userId: string;
  userName: string;
  avatarUrl?: string;
  color: string;
}

/**
 * cursor-move 消息的 payload 结构
 */
interface CursorMovePayload {
  cursorX: number;
  cursorY: number;
}

/**
 * selection-change 消息的 payload 结构
 */
interface SelectionChangePayload {
  selectedComponentId: string;
}

/**
 * Hook 返回值类型
 */
export interface UseCollaborationResult {
  /** WebSocket 是否已连接 */
  isConnected: boolean;
  /** 连接错误信息 */
  connectionError: string | null;
  /** 重连次数 */
  reconnectAttempts: number;
  /** 发送选中组件变更 */
  sendSelectionChange: (componentId: string | null) => void;
}

/**
 * JSON Patch 转 Immer Patch 格式
 * RFC 6902 path: "/components/1/desc" -> Immer path: ["components", "1", "desc"]
 */
function jsonPatchToImmerPatch(jsonPatches: JSONPatchOp[]): Patch[] {
  return jsonPatches.map((jp) => {
    // 移除开头的 "/" 并按 "/" 分割
    const pathSegments = jp.path
      .slice(1)
      .split("/")
      .map((segment) => {
        // RFC 6901: 反转义 ~1 -> / 和 ~0 -> ~
        const unescaped = segment.replace(/~1/g, "/").replace(/~0/g, "~");
        // 尝试转换为数字（用于数组索引）
        const num = Number(unescaped);
        return isNaN(num) ? unescaped : num;
      });

    const immerPatch: Patch = {
      op: jp.op as "add" | "remove" | "replace",
      path: pathSegments,
    };

    if (jp.op === "add" || jp.op === "replace") {
      immerPatch.value = jp.value;
    }

    return immerPatch;
  });
}

/**
 * 模块级光标移动发射器
 * 允许其他组件（如 EditArea）直接发送光标位置，而不需要调用 useCollaboration hook
 */
let cursorMoveEmitter: ((x: number, y: number) => void) | null = null;

/**
 * 设置光标移动发射器
 */
export function setCursorMoveEmitter(
  emitter: ((x: number, y: number) => void) | null
) {
  cursorMoveEmitter = emitter;
}

/**
 * 获取光标移动发射器
 * 开放给其他组件使用
 */
export function sendCursorPosition(x: number, y: number) {
  cursorMoveEmitter?.(x, y);
}

/**
 * 协同编辑 Hook
 * 直接从 store 读取 pageId 和 editorMode
 *
 * @returns 连接状态信息
 */
export function useCollaboration(): UseCollaborationResult {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const currentUserId = user?.id || "";
  // 使用 ref 存储 userId，避免闭包问题
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const {
    isConnected,
    connectionError,
    setConnected,
    setConnectionError,
    pageId,
    editorMode,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorCursor,
    updateCollaboratorSelection,
    setCollaborators,
    clearCollaborators,
  } = useCollaborationStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 防止并发连接
  const isConnectingRef = useRef(false);

  // ❗️ 关键：使用 ref 存储版本号，避免闭包问题
  const versionRef = useRef<number>(0);
  // 重连次数也用 ref 避免依赖变化
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = 5;

  /**
   * 处理接收到的 WebSocket 消息
   * 核心逻辑：使用 applyRemotePatch 确保不触发回声
   */
  const handleMessage = useCallback(
    (msg: WSMessage) => {
      switch (msg.type) {
        case "sync": {
          // 全量同步：新用户加入时接收完整状态
          const syncPayload = msg.payload as SyncPayload;
          console.log("[WS] Received sync, version:", syncPayload.version);

          // ⚠️ 保存版本号
          versionRef.current = syncPayload.version;

          // 设置初始 Schema（如果后端有数据）
          if (syncPayload.schema && syncPayload.schema.components) {
            const historyStore = useHistoryStore.getState();
            historyStore.setApplyingRemotePatch(true);
            try {
              useComponentsStore.setState({
                components: syncPayload.schema.components as Record<
                  number,
                  any
                >,
                rootId: syncPayload.schema.rootId,
              });
              historyStore.clear();
              console.log("[WS] Schema synced from server");
            } finally {
              historyStore.setApplyingRemotePatch(false);
            }
          }

          // 初始化协作者状态（包含光标和选中）
          if (syncPayload.users && syncPayload.users.length > 0) {
            const collaborators: Collaborator[] = syncPayload.users.map(
              (u) => ({
                userId: u.userId,
                userName: u.userName,
                avatarUrl: u.avatarUrl,
                color: u.color || generateUserColor(u.userId),
                cursorX: u.state?.cursorX,
                cursorY: u.state?.cursorY,
                selectedComponentId: u.state?.selectedComponentId,
              })
            );
            setCollaborators(collaborators);
            console.log("[WS] Collaborators synced:", collaborators.length);
          }
          break;
        }

        case "op-patch": {
          // 增量同步 - 核心防回声逻辑
          console.log("[WS] Received op-patch from:", msg.senderId);

          // 解析 payload
          const patchPayload = msg.payload as OpPatchPayload;

          // 使用 payload 中的版本号+1（发送者的 version 是应用前的，应用后是 version+1）
          // 这比本地 ++ 更可靠，因为后端是版本的唯一真相源
          versionRef.current = patchPayload.version + 1;
          console.log("[WS] Version synced to:", versionRef.current);

          // 将 JSON Patch 转换为 Immer Patch 格式
          const immerPatches = jsonPatchToImmerPatch(patchPayload.patches);

          // 使用 try-catch 防御性更新
          try {
            useHistoryStore.getState().applyRemotePatch(immerPatches);
          } catch (error) {
            console.warn("[WS] Failed to apply remote patch, ignoring:", error);
          }
          break;
        }

        case "user-join": {
          // 新用户加入
          const payload = msg.payload as UserJoinPayload;
          console.log("[WS] User joined:", payload.userName);
          addCollaborator({
            userId: payload.userId,
            userName: payload.userName,
            avatarUrl: payload.avatarUrl,
            color: payload.color || generateUserColor(payload.userId),
          });
          break;
        }

        case "user-leave": {
          // 用户离开 - 清理光标和选中框
          console.log("[WS] User left:", msg.senderId);
          removeCollaborator(msg.senderId);
          break;
        }

        case "cursor-move": {
          // 其他用户光标移动
          const payload = msg.payload as CursorMovePayload;
          // 验证 senderId
          if (!msg.senderId) {
            console.warn("[WS] cursor-move missing senderId:", msg);
            break;
          }
          updateCollaboratorCursor(
            msg.senderId,
            payload.cursorX,
            payload.cursorY
          );
          break;
        }

        case "selection-change": {
          // 其他用户选中组件变更
          const payload = msg.payload as SelectionChangePayload;
          // 验证 senderId
          if (!msg.senderId) {
            console.warn("[WS] selection-change missing senderId:", msg);
            break;
          }
          const componentId = payload.selectedComponentId || undefined;
          updateCollaboratorSelection(msg.senderId, componentId);
          break;
        }

        case "error": {
          const errorPayload = msg.payload as { code: string; message: string };
          console.error("[WS] Server error:", errorPayload);
          message.error(`协同错误: ${errorPayload.message}`);

          // 特殊处理：页面已删除
          if (errorPayload.code === "PAGE_DELETED") {
            message.error("页面已被删除，即将跳转到首页");
            setTimeout(() => {
              window.location.href = "/lowcode-editor/";
            }, 2000);
          }
          break;
        }

        case "ack":
          // 服务器确认，本地操作已成功应用
          // 注意：发送 patch 时已经乐观递增了版本号，这里不需要再递增
          // ACK 可用于：1) 确认操作成功 2) 未来实现回滚机制
          console.log(
            "[WS] ACK received, current version:",
            versionRef.current
          );
          break;

        default:
          console.log("[WS] Unknown message type:", msg.type);
      }
    },
    [
      setCollaborators,
      addCollaborator,
      removeCollaborator,
      updateCollaboratorCursor,
      updateCollaboratorSelection,
    ]
  );

  /**
   * 建立 WebSocket 连接
   */
  const connect = useCallback(async () => {
    // 防止并发连接
    if (isConnectingRef.current) {
      console.log("[WS] Connection already in progress, skipping");
      return;
    }
    // 如果已经连接，不重复连接
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected, skipping");
      return;
    }
    if (!pageId) return;

    try {
      isConnectingRef.current = true;
      const token = await getToken();
      if (!token) {
        setConnectionError("未登录，无法建立协同连接");
        isConnectingRef.current = false;
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
      const ws = new WebSocket(`${wsUrl}/ws?pageId=${pageId}&token=${token}`);

      ws.onopen = () => {
        console.log("[WS] Connected to", pageId);
        wsRef.current = ws;
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        setConnectionError(null);

        // 注册 patch 发射器
        // 当本地操作产生 patches 时，undoMiddleware 会调用这个回调
        setPatchEmitter((patches: JSONPatchOp[]) => {
          if (ws.readyState === WebSocket.OPEN) {
            // ⚠️ 关键：发送时使用当前版本号
            const wsMessage = {
              type: "op-patch",
              payload: {
                patches: patches,
                version: versionRef.current, // 使用 ref 中的版本号
              },
              ts: Date.now(),
            };
            ws.send(JSON.stringify(wsMessage));
            console.log(
              "[WS] Sent op-patch, version:",
              versionRef.current,
              "patches:",
              patches.length
            );

            // 乐观更新：本地操作成功后立即递增版本号
            // TODO：如果后端返回版本冲突，需要回滚（MVP 暂不实现）
            versionRef.current++;
          }
        });

        // 注册光标移动发射器（节流）
        const throttledCursorMove = throttle((x: number, y: number) => {
          const userId = currentUserIdRef.current;
          if (ws.readyState === WebSocket.OPEN && userId) {
            ws.send(
              JSON.stringify({
                type: "cursor-move",
                senderId: userId,
                payload: { cursorX: x, cursorY: y },
                ts: Date.now(),
              })
            );
          }
        }, 100);
        setCursorMoveEmitter(throttledCursorMove);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          handleMessage(msg);
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("[WS] Connection closed:", event.code, event.reason);
        setConnected(false);
        isConnectingRef.current = false;
        setPatchEmitter(null);

        // 非正常关闭时尝试重连
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(`[WS] Reconnecting in ${delay}ms...`);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError("连接失败，请刷新页面重试");
          message.error("协同连接已断开，请刷新页面");
        }
      };

      ws.onerror = (error) => {
        console.error("[WS] Connection error:", error);
        isConnectingRef.current = false;
        setConnectionError("WebSocket 连接失败");
      };
    } catch (error) {
      console.error("[WS] Failed to establish connection:", error);
      isConnectingRef.current = false;
      setConnectionError("无法建立协同连接");
    }
  }, [pageId, getToken, handleMessage, setConnected, setConnectionError]);

  /**
   * 管理连接生命周期
   */
  useEffect(() => {
    // 本地模式或无 pageId，不建立连接
    if (editorMode !== "live" || !pageId) {
      return;
    }

    // 等待 Clerk 初始化完成
    if (!isLoaded) {
      return;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setPatchEmitter(null);
      setCursorMoveEmitter(null);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
      // 清理协作者
      clearCollaborators();
    };
  }, [pageId, editorMode, isLoaded]); // 只在 pageId、editorMode 或 isLoaded 变化时重新连接

  /**
   * 发送选中组件变更
   */
  const sendSelectionChange = useCallback(
    (componentId: string | null) => {
      const userId = currentUserIdRef.current;
      if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
        wsRef.current.send(
          JSON.stringify({
            type: "selection-change",
            senderId: userId,
            payload: { selectedComponentId: componentId ?? "" },
            ts: Date.now(),
          })
        );
      }
    },
    [] // 不需要依赖 currentUserId，因为使用 ref
  );

  /**
   * 订阅本地选中变更，自动发送 selection-change
   */
  useEffect(() => {
    // 只在连接状态时订阅
    if (!isConnected || editorMode !== "live") return;

    // 使用 subscribeWithSelector 需要先安装中间件，这里使用普通 subscribe
    let prevId = useUIStore.getState().curComponentId;
    const unsubscribe = useUIStore.subscribe((state) => {
      const curComponentId = state.curComponentId;
      if (curComponentId !== prevId) {
        prevId = curComponentId;
        sendSelectionChange(curComponentId ? String(curComponentId) : null);
      }
    });

    return unsubscribe;
  }, [isConnected, editorMode, sendSelectionChange]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts: reconnectAttemptsRef.current,
    sendSelectionChange,
  };
}
