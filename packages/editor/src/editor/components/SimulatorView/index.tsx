/**
 * @file editor/components/SimulatorView/index.tsx
 * @description
 * 主编辑器中的 iframe 容器组件。
 * 职责：
 * - 渲染 iframe，加载 Renderer 入口页面
 * - 初始化 SimulatorHost 通信管理器
 * - 管理 iframe 的生命周期
 * - 根据 canvasSize 控制 iframe 的视觉尺寸
 *
 * @module Components/SimulatorView
 */

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { simulatorHost } from "../../simulator/SimulatorHost";
import { useUIStore } from "../../stores/uiStore";

export function SimulatorView() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { canvasSize } = useUIStore();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    simulatorHost.connect(iframe);

    return () => {
      simulatorHost.disconnect();
    };
  }, []);

  // BASE_URL 在开发和生产环境下都会正确返回 /lowcode-editor/
  const rendererUrl = `${import.meta.env.BASE_URL}renderer.html`;

  // 根据 canvasSize 控制 iframe 容器尺寸（复用原 EditArea 的样式逻辑）
  const isDesktop = canvasSize.mode === "desktop";

  const iframeStyle = useMemo<CSSProperties>(
    () => ({
      width: isDesktop ? "100%" : canvasSize.width,
      height: isDesktop ? "100%" : canvasSize.height,
      minHeight: isDesktop ? "100%" : undefined,
      border: "none",
      display: "block",
      backgroundColor: "#fff",
      boxShadow: isDesktop ? "none" : "0 4px 24px rgba(0, 0, 0, 0.12)",
      borderRadius: isDesktop ? 0 : 8,
      transition: "box-shadow 0.3s ease, border-radius 0.3s ease",
    }),
    [isDesktop, canvasSize.width, canvasSize.height],
  );

  const workspaceStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      justifyContent: isDesktop ? "stretch" : "center",
      alignItems: isDesktop ? "stretch" : "flex-start",
      padding: isDesktop ? 0 : 24,
      width: "100%",
      height: "100%",
      background: `
        radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.08) 2px, transparent 0),
        radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.04) 2px, transparent 0),
        linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)
      `,
      backgroundSize: "50px 50px, 100px 100px, 100% 100%",
      overflow: "auto",
    }),
    [isDesktop],
  );

  return (
    <div style={workspaceStyle}>
      <iframe
        ref={iframeRef}
        src={rendererUrl}
        style={iframeStyle}
        title="Lowcode Canvas Renderer"
      />
    </div>
  );
}
