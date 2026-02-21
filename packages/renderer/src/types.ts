/**
 * @file @lowcode/renderer 类型定义
 * @description
 * 统一渲染引擎的输入契约（Step 1.5.0）。
 * 输入模型冻结为：components + rootId + componentMap（范式化 Map），
 * 不混用树结构输入。
 *
 * @module Renderer/Types
 */

import type { ReactElement } from "react";
import type { Component } from "@lowcode/schema";
import type { ComponentConfig } from "@lowcode/materials";

// ==================== 设计态注入点 ====================

/**
 * 设计态钩子 — 由 editor 侧注入，renderer 只定义接口
 *
 * 参考阿里 lowcode-engine：
 * - customCreateElement → 包裹 DragWrapper / 注入 data-component-id
 * - onCompGetRef → 收集 DOM 实例用于蒙层定位
 */
export interface DesignHooks {
  /**
   * 组件 DOM 挂载/更新时回调。
   * editor 侧用此回调收集每个节点的 DOM 实例，
   * 用于计算 HoverMask / SelectedMask 位置。
   */
  onCompGetRef?: (componentId: number, el: HTMLElement | null) => void;

  /**
   * 自定义 createElement 包装器。
   * editor 侧通过此钩子注入 DragWrapper、data-component-id 等设计态能力。
   *
   * @param componentId  当前渲染的组件 ID
   * @param componentName 当前渲染的组件名称
   * @param element      SchemaRenderer 构造好的原始 ReactElement
   * @returns            包装后的 ReactElement
   */
  customCreateElement?: (
    componentId: number,
    componentName: string,
    element: ReactElement,
  ) => ReactElement;
}

// ==================== 事件回调 ====================

/**
 * 运行态事件回调签名。
 * 由 editor 侧的 EventOrchestrator 实现（goToLink / showMessage / customJs / componentMethod）。
 * renderer 本身不包含事件编排逻辑。
 */
export type EventHandler = (
  componentId: number,
  eventName: string,
  args: unknown[],
) => void;

// ==================== 核心 Props ====================

/**
 * SchemaRenderer 的完整 Props — 渲染引擎输入契约
 *
 * 设计原则：
 * - designMode 切换行为，不切换数据模型
 * - renderer 包 **不依赖** 任何 store / editor 模块
 * - 设计态能力通过 designHooks 注入，运行态事件通过 onEvent 注入
 */
export interface SchemaRendererProps {
  /** 范式化的组件 Map（id → Component） */
  components: Record<number, Component>;

  /** 根节点 ID */
  rootId: number;

  /** 物料注册表 — name → ComponentConfig 的映射 */
  componentMap: Record<string, ComponentConfig>;

  /**
   * 渲染模式
   * - `"design"` — 设计态，注入 data-component-id、收集 ref、使用 component
   * - `"live"`   — 运行态，绑定事件编排、优先使用 runtimeComponent
   *
   * @default "live"
   */
  designMode?: "design" | "live";

  /**
   * 设计态钩子（仅 designMode="design" 时生效）。
   * 由 editor 侧注入，renderer 不实现任何编辑器逻辑。
   */
  designHooks?: DesignHooks;

  /**
   * 运行态事件回调（仅 designMode="live" 时生效）。
   * 组件触发事件时，SchemaRenderer 调用此回调将事件代理到上层。
   */
  onEvent?: EventHandler;

  /**
   * 运行态组件 ref 回调（仅 designMode="live" 时生效）。
   * 用于收集组件实例（componentMethod 场景下需要调用组件方法）。
   */
  onCompRef?: (componentId: number, ref: unknown) => void;

  /**
   * 懒加载的 fallback 组件
   * @default <div style={{ padding: 8, color: '#999' }}>Loading...</div>
   */
  suspenseFallback?: ReactElement;
}

// ==================== 内部辅助 ====================

/**
 * 单节点渲染 Props（SchemaRenderer 内部使用）
 */
export interface RenderNodeProps {
  id: number;
}
