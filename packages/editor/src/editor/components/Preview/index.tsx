/**
 * @file /src/editor/components/Preview/index.tsx
 * @description
 * 预览模式 — 使用 SchemaRenderer(designMode="live") 统一渲染核心。
 * 事件编排通过 useEventOrchestrator Hook 注入。
 *
 * v3 架构变更：
 * - 渲染逻辑委托给 @lowcode/renderer 的 SchemaRenderer
 * - 事件编排提取到 useEventOrchestrator Hook
 * - 本组件仅负责从 store 取数据并传给 SchemaRenderer
 *
 * @security
 * - 自定义 JS (customJs) 使用 iframe 沙盒执行，参见 utils/sandboxExecutor.ts
 *
 * @module Components/Preview
 */

import React, { Suspense, useRef, useCallback } from "react";
import { ConfigProvider, message } from "antd";
import { SchemaRenderer } from "@lowcode/renderer";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponentsStore } from "../../stores/components";
import { useEventOrchestrator } from "../../hooks/useEventOrchestrator";
import { UNIFIED_RENDERER } from "../../../config/featureFlags";
import type { Component } from "@lowcode/schema";
import type { ActionConfig } from "../Setting/ComponentEvent/ActionModal";
import { executeSandboxedCode } from "../../utils/sandboxExecutor";
import LoadingPlaceholder from "../common/LoadingPlaceholder";

export function Preview() {
  const { components, rootId } = useComponentsStore();
  const { componentConfig } = useComponentConfigStore();

  // ==================== 新路径：SchemaRenderer ====================
  const { handleEvent, handleCompRef } = useEventOrchestrator({
    components,
    componentConfig,
  });

  // ==================== Legacy 路径（Feature Flag 回退） ====================

  const componentRefs = useRef<Record<string, unknown>>({});

  const legacyHandleEvent = useCallback(
    (component: Component) => {
      const props: Record<string, unknown> = {};
      const config = componentConfig[component.name];

      config?.events?.forEach((event) => {
        const eventConfig = component.props[event.name] as
          | { actions?: ActionConfig[] }
          | undefined;

        if (eventConfig) {
          props[event.name] = (...args: unknown[]) => {
            eventConfig?.actions?.forEach((action: ActionConfig) => {
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
            });
          };
        }
      });

      return props;
    },
    [componentConfig],
  );

  const LegacyRenderNode = useCallback(
    ({ id }: { id: number }) => {
      const component = components[id];
      if (!component) return null;

      const config = componentConfig?.[component.name];
      if (!config) return null;

      const ComponentToRender = config.runtimeComponent || config.component;
      if (!ComponentToRender) return null;

      return (
        <Suspense
          key={component.id}
          fallback={<LoadingPlaceholder componentDesc={config.desc} />}
        >
          {React.createElement(
            ComponentToRender,
            {
              key: component.id,
              style: component.styles,
              ref: (ref: unknown) => {
                componentRefs.current[component.id] = ref;
              },
              ...config.defaultProps,
              ...component.props,
              ...legacyHandleEvent(component),
            },
            component.children?.map((childId) => (
              <LegacyRenderNode key={childId} id={childId} />
            )),
          )}
        </Suspense>
      );
    },
    [components, componentConfig, legacyHandleEvent],
  );

  return (
    <ConfigProvider theme={{ inherit: false }}>
      <div>
        {UNIFIED_RENDERER ? (
          rootId && (
            <SchemaRenderer
              components={components}
              rootId={rootId}
              componentMap={componentConfig}
              designMode="live"
              onEvent={handleEvent}
              onCompRef={handleCompRef}
            />
          )
        ) : (
          rootId && <LegacyRenderNode id={rootId} />
        )}
      </div>
    </ConfigProvider>
  );
}
