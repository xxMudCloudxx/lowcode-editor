/**
 * @file useRenderComponents.tsx
 * @description
 * 递归渲染组件树的 Hook。
 * 基于范式化 Map 递归渲染组件，支持拖拽节点包装。
 */

import React, { Suspense, useCallback, useMemo } from "react";
import { useComponentsStore } from "../../../stores/components";
import { useComponentConfigStore } from "../../../stores/component-config";
import { DraggableNode } from "../DraggableNode";
import LoadingPlaceholder from "../../common/LoadingPlaceholder";

/**
 * 递归渲染组件树
 * @returns { RenderNode, componentTree }
 */
export function useRenderComponents() {
  const { components, rootId } = useComponentsStore();
  const { componentConfig } = useComponentConfigStore();

  /**
   * 判断组件是否为容器
   * 读取 editor.isContainer 配置
   */
  const isContainerComponent = useCallback(
    (name: string): boolean => {
      const config = componentConfig?.[name];
      if (!config) return false;
      return config.editor.isContainer ?? false;
    },
    [componentConfig]
  );

  /**
   * 基于范式化 Map 的递归渲染函数。
   * 使用 DraggableNode 注入拖拽能力。
   */
  const RenderNode = useCallback(
    ({ id }: { id: number }) => {
      const component = components[id];
      if (!component) return null;

      const config = componentConfig?.[component.name];
      if (!config) return null;

      // 获取要渲染的组件
      const ComponentToRender = config.component;

      if (!ComponentToRender) return null;

      // 判断是否为容器组件
      const isContainer = isContainerComponent(component.name);

      return (
        <Suspense
          key={component.id}
          fallback={<LoadingPlaceholder componentDesc={config.desc} />}
        >
          <DraggableNode
            id={component.id}
            name={component.name}
            isContainer={isContainer}
          >
            {React.createElement(
              ComponentToRender,
              {
                // 通用属性
                ...config.defaultProps,
                ...component.props,
                style: component.styles,
              },
              component.children?.map((childId) => (
                <RenderNode key={childId} id={childId} />
              ))
            )}
          </DraggableNode>
        </Suspense>
      );
    },
    [components, componentConfig, isContainerComponent]
  );

  const componentTree = useMemo(() => {
    return rootId ? <RenderNode id={rootId} /> : null;
  }, [rootId, RenderNode]);

  return { RenderNode, componentTree };
}
