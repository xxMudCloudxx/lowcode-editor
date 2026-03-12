/**
 * @file renderer/RendererApp.tsx
 * @description
 * Iframe 内部的根组件。
 * 职责：
 * - 初始化 postMessage 通信 (SimulatorRenderer)
 * - 渲染 EditArea (从主应用迁移过来的画布)
 *
 * @module Renderer/App
 */

import { useEffect } from "react";
import { ConfigProvider } from "antd";
import { simulatorRenderer } from "../editor/simulator/SimulatorRenderer";
import { useRendererStore } from "./stores/rendererStore";
import { RendererEditArea } from "./components/RendererEditArea";

export function RendererApp() {
  useEffect(() => {
    const storeAPI = useRendererStore.getState();

    // 初始化通信
    simulatorRenderer.init({
      setComponentsState: storeAPI.setComponentsState,
      applyComponentPatches: storeAPI.applyComponentPatches,
      getVersion: () => useRendererStore.getState().version,
      setUIState: storeAPI.setUIState,
      setDraggingMaterial: storeAPI.setDraggingMaterial,
    });

    return () => {
      simulatorRenderer.destroy();
    };
  }, []);

  return (
    <ConfigProvider theme={{ inherit: false }}>
      <RendererEditArea />
    </ConfigProvider>
  );
}
