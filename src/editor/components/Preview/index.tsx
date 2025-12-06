/**
 * @file /src/editor/components/Preview/index.tsx
 * @description
 * 预览模式的渲染引擎。
 * 负责将 `components` store 中的组件树数据渲染成一个可交互、
 * 纯净的（无编辑器相关交互逻辑）React 应用界面。
 * 同时根据“事件”面板中配置的动作，动态绑定组件事件。
 * @module Components/Preview
 */

import React, { Suspense, useRef } from "react";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponentsStore } from "../../stores/components";
import type { Component } from "../../interface";
import { message, ConfigProvider } from "antd";
import type { ActionConfig } from "../Setting/ComponentEvent/ActionModal";
import LoadingPlaceholder from "../common/LoadingPlaceholder";

export function Preview() {
  const { components, rootId } = useComponentsStore();
  const { componentConfig } = useComponentConfigStore();

  /**
   * 使用 useRef 存储所有渲染出来的组件实例引用。
   * key 为组件 ID，value 为组件实例。
   * 用于实现“组件方法调用”类的动作（componentMethod）。
   */
  const componentRefs = useRef<Record<string, any>>({});

  /**
   * 事件和动作的编排器。
   * 读取组件 props 中配置的事件（如 onClick），
   * 根据事件配置的 actions 动态生成事件处理函数。
   */
  function handleEvent(component: Component) {
    const props: Record<string, any> = {};

    componentConfig[component.name].events?.forEach((event) => {
      const eventConfig = component.props[event.name];

      if (eventConfig) {
        props[event.name] = (...args: any[]) => {
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
              // 警告：使用 new Function 动态执行代码存在安全风险，生产环境需谨慎处理。
              const func = new Function("context", "args", action.code);
              func(
                {
                  name: component.name,
                  props: component.props,
                  ShowMessage(content: string) {
                    message.success(content);
                  },
                },
                args
              );
            } else if (action.type === "componentMethod") {
              const target = componentRefs.current[action.config.componentId];
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
  }

  /**
   * 基于范式化 Map 的递归渲染函数（预览模式）。
   * 通过组件 id 从 Map 中取出节点，查找其 prod 版本组件并渲染，
   * 再根据 children id 列表递归渲染子节点。
   */
  const RenderNode = ({ id }: { id: number }) => {
    const component = components[id];
    if (!component) return null;

    const config = componentConfig?.[component.name];
    if (!config?.prod) {
      return null;
    }

    return (
      <Suspense
        key={component.id}
        fallback={<LoadingPlaceholder componentDesc={config.desc} />}
      >
        {React.createElement(
          config.prod,
          {
            key: component.id,
            id: component.id,
            name: component.name,
            styles: component.styles,
            // 将组件 ref 存入 componentRefs.current 字典
            ref: (ref: Record<string, any>) => {
              componentRefs.current[component.id] = ref;
            },
            // 合并默认 props、用户配置的 props 和动态生成的事件处理 props
            ...config.defaultProps,
            ...component.props,
            ...handleEvent(component),
          },
          component.children?.map((childId) => (
            <RenderNode key={childId} id={childId} />
          ))
        )}
      </Suspense>
    );
  };

  return (
    <ConfigProvider theme={{ inherit: false }}>
      <div>{rootId && <RenderNode id={rootId} />}</div>
    </ConfigProvider>
  );
}
