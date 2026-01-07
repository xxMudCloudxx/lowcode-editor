/**
 * @file ErrorOverlay.tsx
 * @description
 * 个性化错误遮罩组件。
 * 根据不同的 WebSocket 错误码展示不同的 UI（图标、标题、描述、倒计时）。
 */

import { useEffect, useState, useCallback } from "react";
import { useClerk } from "@clerk/clerk-react";
import {
  useCollaborationStore,
  type WSErrorCode,
} from "../../stores/collaborationStore";

/**
 * 错误配置映射
 */
const ERROR_CONFIG: Record<
  WSErrorCode,
  {
    icon: string;
    title: string;
    description: string;
    action: { label: string; type: "signin" | "home" | "reload" } | null;
  }
> = {
  VERSION_CONFLICT: {
    icon: "🔄",
    title: "同步中...",
    description: "检测到版本冲突，正在重新同步",
    action: null,
  },
  PATCH_FAILED: {
    icon: "🔄",
    title: "同步中...",
    description: "正在重新同步数据",
    action: null,
  },
  PATCH_INVALID: {
    icon: "⚠️",
    title: "数据异常",
    description: "Patch 格式错误",
    action: null,
  },
  ROOM_NOT_FOUND: {
    icon: "⚠️",
    title: "房间不存在",
    description: "正在尝试重新连接...",
    action: null,
  },
  UNAUTHORIZED: {
    icon: "🔐",
    title: "登录已过期",
    description: "请重新登录以继续编辑",
    action: { label: "重新登录", type: "signin" },
  },
  PAGE_DELETED: {
    icon: "🗑️",
    title: "页面已删除",
    description: "此页面已被删除，即将跳转首页",
    action: { label: "返回首页", type: "home" },
  },
  INTERNAL_ERROR: {
    icon: "❌",
    title: "服务异常",
    description: "服务器发生错误，请稍后重试",
    action: { label: "刷新页面", type: "reload" },
  },
  DISCONNECTED: {
    icon: "📡",
    title: "连接已断开",
    description: "正在尝试重新连接...",
    action: null,
  },
};

export function ErrorOverlay() {
  const { redirectToSignIn } = useClerk();
  const errorOverlay = useCollaborationStore((s) => s.errorOverlay);
  const setErrorOverlay = useCollaborationStore((s) => s.setErrorOverlay);

  const [countdown, setCountdown] = useState<number | null>(null);

  // 执行操作
  const executeAction = useCallback(
    (actionType: "signin" | "home" | "reload") => {
      setErrorOverlay(null);
      switch (actionType) {
        case "signin":
          redirectToSignIn();
          break;
        case "home":
          window.location.href = "/lowcode-editor/";
          break;
        case "reload":
          window.location.reload();
          break;
      }
    },
    [redirectToSignIn, setErrorOverlay]
  );

  // 初始化倒计时
  useEffect(() => {
    if (errorOverlay?.countdown != null) {
      setCountdown(errorOverlay.countdown);
    } else {
      setCountdown(null);
    }
  }, [errorOverlay]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // 倒计时结束时自动执行
  useEffect(() => {
    if (countdown === 0 && errorOverlay) {
      const config = ERROR_CONFIG[errorOverlay.code];
      if (config.action) {
        executeAction(config.action.type);
      }
    }
  }, [countdown, errorOverlay, executeAction]);

  // 不显示遮罩
  if (!errorOverlay) return null;

  const config = ERROR_CONFIG[errorOverlay.code];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.158)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px 32px",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          textAlign: "center",
          minWidth: 280,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>{config.icon}</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {config.title}
        </div>
        <div style={{ color: "#666", marginBottom: 16 }}>
          {config.description}
        </div>

        {/* 倒计时显示 */}
        {countdown !== null && countdown > 0 && config.action && (
          <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
            {countdown} 秒后自动{config.action.label}
          </div>
        )}

        {/* 操作按钮 */}
        {config.action && (
          <button
            onClick={() => executeAction(config.action!.type)}
            style={{
              padding: "8px 24px",
              fontSize: 14,
              fontWeight: 500,
              color: "white",
              backgroundColor: "#1890ff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {config.action.label}
          </button>
        )}

        {/* 无操作时的提示 */}
        {!config.action && (
          <div style={{ fontSize: 12, color: "#999" }}>编辑功能已暂时禁用</div>
        )}
      </div>
    </div>
  );
}
