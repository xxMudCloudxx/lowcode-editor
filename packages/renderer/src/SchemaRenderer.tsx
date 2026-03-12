/**
 * @file SchemaRenderer — 统一渲染核心
 * @description
 * 负责将范式化的 components Map 递归渲染为 React 组件树。
 * 同一组件通过 designMode 服务 design（编辑态）和 live（运行态）两种场景。
 *
 * 设计原则（参考阿里 lowcode-engine）：
 * 1. 纯渲染管道 — 不依赖任何 store / editor 模块
 * 2. 设计态能力通过 designHooks 注入（customCreateElement / onCompGetRef）
 * 3. 运行态事件通过 onEvent 回调代理到上层（EventOrchestrator 在 editor 内）
 *
 * @module Renderer/SchemaRenderer
 */

import React, {
  Suspense,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useSyncExternalStore,
  createContext,
  useContext,
  type ReactElement,
} from "react";
import type { Component } from "@lowcode/schema";
import type { ComponentConfig } from "@lowcode/materials";
import type {
  SchemaRendererProps,
  DesignHooks,
  EventHandler,
  RenderNodeProps,
} from "./types";

// ==================== Context ====================

/**
 * 渲染上下文 — 通过 Context 避免逐层 props drilling
 *
 * 关键设计：`components` 不放入 Context。
 * 而是通过 getComponent + subscribe 让每个 RenderNode 按 ID 独立订阅。
 * 这样当 components 变更时，只有实际被修改的节点触发重渲染（Immer 保留未修改对象引用）。
 */
interface RendererContextValue {
  getComponent: (id: number) => Component | undefined;
  subscribe: (callback: () => void) => () => void;
  componentMap: Record<string, ComponentConfig>;
  designMode: "design" | "live";
  designHooks: DesignHooks;
  onEvent?: EventHandler;
  onCompRef?: (componentId: number, ref: unknown) => void;
  suspenseFallback: ReactElement;
}

const RendererContext = createContext<RendererContextValue | null>(null);

function useRendererContext(): RendererContextValue {
  const ctx = useContext(RendererContext);
  if (!ctx) {
    throw new Error(
      "[SchemaRenderer] RenderNode must be used inside <SchemaRenderer>",
    );
  }
  return ctx;
}

// ==================== RenderNode ====================

/**
 * 递归渲染单节点。
 * 通过 useSyncExternalStore 按 ID 订阅自身组件数据，
 * Immer 保留未修改对象引用 → 只有实际变更的节点重渲染。
 */
const RenderNode: React.FC<RenderNodeProps> = React.memo(({ id }) => {
  const {
    getComponent,
    subscribe,
    componentMap,
    designMode,
    designHooks,
    onEvent,
    onCompRef,
    suspenseFallback,
  } = useRendererContext();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getSnapshot = useCallback(() => getComponent(id), [getComponent, id]);
  const component = useSyncExternalStore(subscribe, getSnapshot);
  if (!component) return null;

  const config = componentMap[component.name];
  if (!config) return null;

  // ---- 选择组件实现 ----
  // 设计态使用 component（编辑器形态），运行态优先 runtimeComponent（如 Modal 弹窗形态）
  const ComponentImpl =
    designMode === "live"
      ? config.runtimeComponent || config.component
      : config.component;

  if (!ComponentImpl) return null;

  // ---- 合并 props ----
  const mergedProps: Record<string, unknown> = {
    ...config.defaultProps,
    ...component.props,
    style: component.styles,
  };

  // ---- 设计态：注入 data-component-id 用于蒙层定位 ----
  if (designMode === "design") {
    mergedProps["data-component-id"] = component.id;
  }

  // ---- 运行态：绑定事件 ----
  if (designMode === "live" && onEvent && config.events) {
    for (const event of config.events) {
      const eventConfig = component.props[event.name] as
        | { actions?: unknown[] }
        | undefined;
      if (eventConfig?.actions?.length) {
        mergedProps[event.name] = (...args: unknown[]) => {
          onEvent(component.id, event.name, args);
        };
      }
    }
  }

  // ---- 运行态：收集组件 ref ----
  if (designMode === "live" && onCompRef) {
    mergedProps.ref = (ref: unknown) => {
      onCompRef(component.id, ref);
    };
  }

  // ---- 递归子节点 ----
  const childElements = component.children?.map((childId) => (
    <RenderNode key={childId} id={childId} />
  ));

  // ---- createElement ----
  const element = React.createElement(
    ComponentImpl,
    mergedProps,
    childElements,
  );

  // ---- 设计态：customCreateElement 包装（注入 DragWrapper 等） ----
  const wrappedElement =
    designMode === "design" && designHooks.customCreateElement
      ? designHooks.customCreateElement(component.id, component.name, element)
      : element;

  return <Suspense fallback={suspenseFallback}>{wrappedElement}</Suspense>;
});

RenderNode.displayName = "RenderNode";

// ==================== SchemaRenderer ====================

const DEFAULT_FALLBACK = (
  <div style={{ padding: 8, color: "#999" }}>Loading...</div>
);
const EMPTY_HOOKS: DesignHooks = {};

/**
 * SchemaRenderer — 核心渲染入口
 *
 * @example 设计态 (editor iframe 内)
 * ```tsx
 * <SchemaRenderer
 *   components={components}
 *   rootId={rootId}
 *   componentMap={componentConfigMap}
 *   designMode="design"
 *   designHooks={{
 *     customCreateElement: (id, name, el) => <DragWrapper id={id}>{el}</DragWrapper>,
 *     onCompGetRef: (id, el) => collect(id, el),
 *   }}
 * />
 * ```
 *
 * @example 运行态 (预览模式)
 * ```tsx
 * <SchemaRenderer
 *   components={components}
 *   rootId={rootId}
 *   componentMap={componentConfig}
 *   designMode="live"
 *   onEvent={handleEvent}
 *   onCompRef={(id, ref) => { refs.current[id] = ref; }}
 * />
 * ```
 */
export const SchemaRenderer: React.FC<SchemaRendererProps> = React.memo(
  ({
    components,
    rootId,
    componentMap,
    designMode = "live",
    designHooks = EMPTY_HOOKS,
    onEvent,
    onCompRef,
    suspenseFallback = DEFAULT_FALLBACK,
  }) => {
    // ---- Per-node subscription pattern ----
    // components 存入 ref（同步更新），通过 subscribe/getComponent 暴露给 RenderNode。
    // 每个 RenderNode 通过 useSyncExternalStore 只订阅自己的 Component 对象，
    // Immer 保留未修改对象引用 → Object.is 比较 → 只有实际变更的节点重渲染。

    const componentsRef = useRef(components);
    componentsRef.current = components;

    const listenersRef = useRef(new Set<() => void>());

    // components 引用变化时通知所有订阅者
    useEffect(() => {
      listenersRef.current.forEach((fn) => fn());
    }, [components]);

    const getComponent = useCallback(
      (id: number) => componentsRef.current[id],
      [],
    );

    const subscribe = useCallback((listener: () => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    }, []);

    // Context 值不包含 components → 引用稳定 → 不会击穿子树 memo
    const contextValue = useMemo<RendererContextValue>(
      () => ({
        getComponent,
        subscribe,
        componentMap,
        designMode,
        designHooks,
        onEvent,
        onCompRef,
        suspenseFallback,
      }),
      [
        getComponent,
        subscribe,
        componentMap,
        designMode,
        designHooks,
        onEvent,
        onCompRef,
        suspenseFallback,
      ],
    );

    if (!rootId || !components[rootId]) {
      return null;
    }

    return (
      <RendererContext.Provider value={contextValue}>
        <RenderNode id={rootId} />
      </RendererContext.Provider>
    );
  },
);

SchemaRenderer.displayName = "SchemaRenderer";
