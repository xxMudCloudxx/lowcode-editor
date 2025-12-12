/**
 * @file /src/editor/hooks/useCollaboration.ts
 * @description
 * WebSocket 协同编辑 Hook。
 * 管理与后端的 WebSocket 连接、消息收发、自动重连。
 *
 * 核心功能：
 * - 本地操作通过 setPatchEmitter 发送到 WebSocket
 * - 远程操作通过 applyRemotePatch 应用，不触发二次发送
 * - 防御性更新，静默忽略失败的 patch
 *
 * @module Hooks/useCollaboration
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { message } from "antd";
import { useHistoryStore } from "../stores/historyStore";
import { useComponentsStore } from "../stores/components";
import { useCollaborationStore } from "../stores/collaborationStore";
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
    | "error";
  senderId: string;
  payload: unknown;
  ts: number;
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
  users: Array<{ userId: string; userName: string }>;
}

/**
 * op-patch 消息的 payload 结构（从其他用户接收）
 */
interface OpPatchPayload {
  patches: JSONPatchOp[];
  version: number;
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
 * 协同编辑 Hook
 * 直接从 store 读取 pageId 和 editorMode
 *
 * @returns 连接状态信息
 */
export function useCollaboration(): UseCollaborationResult {
  const { getToken } = useAuth();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const {
    isConnected,
    connectionError,
    setConnected,
    setConnectionError,
    pageId,
    editorMode,
  } = useCollaborationStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ❗️ 关键：使用 ref 存储版本号，避免闭包问题
  const versionRef = useRef<number>(0);

  const maxReconnectAttempts = 5;

  /**
   * 处理接收到的 WebSocket 消息
   * 核心逻辑：使用 applyRemotePatch 确保不触发回声
   */
  const handleMessage = useCallback((msg: WSMessage) => {
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
              components: syncPayload.schema.components as Record<number, any>,
              rootId: syncPayload.schema.rootId,
            });
            historyStore.clear();
            console.log("[WS] Schema synced from server");
          } finally {
            historyStore.setApplyingRemotePatch(false);
          }
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

      case "user-join":
        console.log("[WS] User joined:", msg.payload);
        break;

      case "user-leave":
        console.log("[WS] User left:", msg.senderId);
        break;

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
        console.log("[WS] ACK received, current version:", versionRef.current);
        break;

      default:
        console.log("[WS] Unknown message type:", msg.type);
    }
  }, []);

  /**
   * 建立 WebSocket 连接
   */
  const connect = useCallback(async () => {
    if (!pageId) return;

    try {
      const token = await getToken();
      if (!token) {
        setConnectionError("未登录，无法建立协同连接");
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
      const ws = new WebSocket(`${wsUrl}/ws?pageId=${pageId}&token=${token}`);

      ws.onopen = () => {
        console.log("[WS] Connected to", pageId);
        wsRef.current = ws;
        setConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);

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
        setPatchEmitter(null);

        // 非正常关闭时尝试重连
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`[WS] Reconnecting in ${delay}ms...`);
          setReconnectAttempts((prev) => prev + 1);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError("连接失败，请刷新页面重试");
          message.error("协同连接已断开，请刷新页面");
        }
      };

      ws.onerror = (error) => {
        console.error("[WS] Connection error:", error);
        setConnectionError("WebSocket 连接失败");
      };
    } catch (error) {
      console.error("[WS] Failed to establish connection:", error);
      setConnectionError("无法建立协同连接");
    }
  }, [pageId, getToken, handleMessage, reconnectAttempts]);

  /**
   * 管理连接生命周期
   */
  useEffect(() => {
    // 本地模式或无 pageId，不建立连接
    if (editorMode !== "live" || !pageId) {
      return;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setPatchEmitter(null);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [pageId, editorMode]); // 只在 pageId 或 editorMode 变化时重新连接

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
  };
}
