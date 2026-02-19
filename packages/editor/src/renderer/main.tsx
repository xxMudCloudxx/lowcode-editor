/**
 * @file renderer/main.tsx
 * @description
 * Renderer (iframe) 入口文件。
 * 仅负责挂载 RendererApp，通信初始化由 RendererApp 内部完成。
 */

import { createRoot } from "react-dom/client";
import { RendererApp } from "./RendererApp";
import "../index.css";
import "./renderer.css";

createRoot(document.getElementById("root")!).render(<RendererApp />);
