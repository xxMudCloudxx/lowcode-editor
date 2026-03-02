/**
 * @file renderer/main.tsx
 * @description
 * Renderer (iframe) 入口文件。
 * 仅负责挂载 RendererApp，通信初始化由 RendererApp 内部完成。
 */

import { enablePatches } from "immer";
import { createRoot } from "react-dom/client";
import { RendererApp } from "./RendererApp";
import "../index.css";
import "./renderer.css";

// Renderer 侧也需要启用 Immer patches，因为 applyPatches 会用到
enablePatches();

createRoot(document.getElementById("root")!).render(<RendererApp />);
