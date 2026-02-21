/**
 * @file renderer/RendererApp.tsx
 * @description
 * Iframe 内部的根组件。
 * 职责：
 * - 初始化 postMessage 通信 (SimulatorRenderer)
 * - 提供独立的 DndProvider 上下文
 * - 渲染 EditArea (从主应用迁移过来的画布)
 *
 * @module Renderer/App
 */

import { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
      setUIState: storeAPI.setUIState,
      setDraggingMaterial: storeAPI.setDraggingMaterial,
    });

    return () => {
      simulatorRenderer.destroy();
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <ConfigProvider theme={{ inherit: false }}>
        <RendererEditArea />
      </ConfigProvider>
    </DndProvider>
  );
}
