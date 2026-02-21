/**
 * @file useEventOrchestrator — 运行态事件编排 Hook
 * @description
 * 从旧 Preview 组件提取的事件编排逻辑，
 * 封装为独立 Hook 供 SchemaRenderer(designMode="live") 的 onEvent 回调使用。
 *
 * 支持的动作类型：
 * - goToLink     — 跳转链接
 * - showMessage  — 消息提示
 * - customJs     — iframe 沙盒执行用户代码
 * - componentMethod — 调用目标组件方法
 *
 * 设计原则：
 * - 事件编排保留在 editor 包（不下沉到 renderer 包）
 * - executeSandboxedCode 直接在此使用（editor 内部模块）
 * - 通过 onEvent 签名与 SchemaRenderer 解耦
 *
 * @module Editor/Hooks/useEventOrchestrator
 */

import { useCallback, useRef } from "react";
import { message } from "antd";
import type { ComponentConfig } from "@lowcode/materials";
import type { Component } from "@lowcode/schema";
import type { EventHandler } from "@lowcode/renderer";
import type { ActionConfig } from "../components/Setting/ComponentEvent/ActionModal";
import { executeSandboxedCode } from "../utils/sandboxExecutor";

export interface UseEventOrchestratorOptions {
  /** 组件 Map（id → Component） */
  components: Record<number, Component>;
  /** 物料配置 Map（name → ComponentConfig） */
  componentConfig: Record<string, ComponentConfig>;
}

export interface EventOrchestratorResult {
  /** 作为 SchemaRenderer 的 onEvent prop */
  handleEvent: EventHandler;
  /** 作为 SchemaRenderer 的 onCompRef prop，收集组件实例 */
  handleCompRef: (componentId: number, ref: unknown) => void;
}

/**
 * 运行态事件编排 Hook
 *
 * @example
 * ```tsx
 * const { handleEvent, handleCompRef } = useEventOrchestrator({
 *   components, componentConfig,
 * });
 * <SchemaRenderer designMode="live" onEvent={handleEvent} onCompRef={handleCompRef} />
 * ```
 */
export function useEventOrchestrator({
  components,
  componentConfig,
}: UseEventOrchestratorOptions): EventOrchestratorResult {
  /**
   * 存储所有渲染出来的组件实例引用。
   * key 为组件 ID，value 为组件实例。
   * 用于实现 "componentMethod" 类型的动作。
   */
  const componentRefs = useRef<Record<string, unknown>>({});

  const handleCompRef = useCallback((componentId: number, ref: unknown) => {
    componentRefs.current[componentId] = ref;
  }, []);

  const handleEvent: EventHandler = useCallback(
    (componentId: number, eventName: string, args: unknown[]) => {
      const component = components[componentId];
      if (!component) return;

      const config = componentConfig[component.name];
      if (!config) return;

      const eventConfig = component.props[eventName] as
        | { actions?: ActionConfig[] }
        | undefined;

      if (!eventConfig?.actions) return;

      for (const action of eventConfig.actions) {
        if (action.type === "goToLink") {
          window.location.href = action.url;
        } else if (action.type === "showMessage") {
          if (action.config.type === "success") {
            message.success(action.config.text);
          } else if (action.config.type === "error") {
            message.error(action.config.text);
          }
        } else if (action.type === "customJs") {
          executeSandboxedCode(action.code, {
            name: component.name,
            props: component.props,
            onShowMessage: (content: string) => message.success(content),
            eventArgs: args,
          }).catch((err: Error) => {
            message.error(`自定义代码执行失败: ${err.message}`);
          });
        } else if (action.type === "componentMethod") {
          const target = componentRefs.current[
            action.config.componentId
          ] as Record<string, (...a: unknown[]) => void> | undefined;
          if (target) {
            if (action.config.args) {
              const params = Object.values(action.config.args);
              target[action.config.method]?.(...params);
            } else {
              target[action.config.method]?.();
            }
          }
        }
      }
    },
    [components, componentConfig],
  );

  return { handleEvent, handleCompRef };
}
