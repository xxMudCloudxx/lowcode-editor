/**
 * @file /src/editor/components/Preview/index.tsx
 * @description
 * 预览模式的渲染引擎。
 * 负责将 `components` store 中的组件树数据，渲染成一个可交互的、
 * 纯净的（无编辑器相关交互逻辑）React 应用界面。
 * 它会动态地为每个组件绑定在“设置”面板中配置的事件和动作。
 * @module Components/Preview
 */

import React, { Suspense, useRef } from "react";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore, type Component } from "../../stores/components";
import { message } from "antd";
import type { ActionConfig } from "../Setting/ComponentEvent/ActionModal";
import LoadingPlaceholder from "../common/LoadingPlaceholder";

export function Preview() {
  const { components } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  /**
   * @description
   * 使用 useRef 存储所有渲染出来的组件实例的引用。
   * 这是一个字典结构，key 是组件的 ID，value 是组件实例。
   * 这个 ref 对于实现“组件方法调用”的动作至关重要，
   * 例如：一个按钮的 onClick 事件需要调用另一个 Modal 组件的 open 方法。
   */
  const componentRefs = useRef<Record<string, any>>({});

  /**
   * @description 事件和动作的编排器。
   * 此函数会读取组件的 props，检查其中配置的事件（如 onClick），
   * 并动态地创建一个包裹函数。当事件被触发时，该包裹函数会依次执行所有配置的“动作”。
   * @param {Component} component - 当前要处理的组件对象。
   * @returns {Record<string, any>} - 一个包含所有事件处理器函数的 props 对象。
   */
  function handleEvent(component: Component) {
    const props: Record<string, any> = {};

    // 遍历组件配置中定义的所有可用事件
    componentConfig[component.name].events?.forEach((event) => {
      const eventConfig = component.props[event.name];

      // 如果用户在设置面板中为该事件配置了动作
      if (eventConfig) {
        // 创建一个包裹函数作为事件处理器
        props[event.name] = (...args: any[]) => {
          // 依次执行所有配置的动作
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
              // 警告：使用 new Function 动态执行代码存在安全风险。
              // 在生产环境中，必须确保 action.code 的来源是可信的，
              // 或者在沙箱(sandbox)环境中执行，以防止恶意代码注入。
              // 此处为了实现灵活性而采用，上下文(context)中暴露了有限的 API。
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
            } else if (action.type == "componentMethod") {
              // 核心逻辑：实现组件间通信
              // 从 componentRefs 字典中找到目标组件的实例
              const component =
                componentRefs.current[action.config.componentId];
              if (component) {
                // 调用目标组件实例上的方法
                component[action.config.method]?.(...args);
              }
            }
          });
        };
      }
    });
    return props;
  }

  /**
   * @description 递归渲染函数（用于预览模式）。
   * 遍历组件树，并使用 React.createElement 动态创建每个组件的“生产版本”(`prod`)。
   * @param {Component[]} components - 要渲染的组件（或子组件）数组。
   * @returns {React.ReactNode} - 渲染出的 React 节点。
   */
  function renderComponents(components: Component[]): React.ReactNode {
    return components.map((component: Component) => {
      const config = componentConfig?.[component.name];

      if (!config?.prod) {
        return null;
      }

      // 使用 React.createElement 动态创建生产版本的组件实例
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
              // 关键：将组件 ref 存入 componentRefs.current 字典中
              ref: (ref: Record<string, any>) => {
                componentRefs.current[component.id] = ref;
              },
              // 合并默认 props、用户配置的 props 和动态生成的事件处理器
              ...config.defaultProps,
              ...component.props,
              ...handleEvent(component),
            },
            // 递归渲染子组件
            renderComponents(component.children || [])
          )}
        </Suspense>
      );
    });
  }

  return <div>{renderComponents(components)}</div>;
}
