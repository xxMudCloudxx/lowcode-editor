/**
 * @file @lowcode/renderer 入口
 * @description
 * 统一渲染引擎包 — 提供 SchemaRenderer 组件与类型导出。
 *
 * SchemaRenderer 是唯一的组件树渲染核心，通过 designMode 同时服务
 * 设计态（编辑画布 / iframe）和运行态（预览模式）。
 *
 * @module Renderer
 */

// ---- 核心组件 ----
export { SchemaRenderer } from "./SchemaRenderer";

// ---- 类型导出 ----
export type {
  SchemaRendererProps,
  DesignHooks,
  EventHandler,
  RenderNodeProps,
} from "./types";

