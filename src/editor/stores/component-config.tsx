/**
 * @file /src/editor/stores/component-config.tsx
 * @description
 * 使用 Zustand 管理所有"物料组件"的配置信息。
 *
 * v2 架构：统一使用 ComponentProtocol 格式
 * - 类型定义位于 types/component-protocol.ts
 *
 * @module Stores/ComponentConfig
 */
import { create } from "zustand";
import {
  materials,
  isProtocolConfig,
  type ComponentConfig,
  type ComponentProtocol,
} from "../materials";
import type {
  SetterConfig,
  EventConfig,
  MethodConfig,
} from "../types/component-protocol";

// 重新导出类型，保持向后兼容
export type {
  SetterConfig as ComponentSetter,
  EventConfig as ComponentEvent,
  MethodConfig as ComponentMethod,
  ComponentConfig,
  ComponentProtocol,
};
export { isProtocolConfig };

interface State {
  // 使用字典结构，以组件名作为 key，快速查找组件配置
  componentConfig: { [key: string]: ComponentConfig };
}

interface Action {
  // 预留的 action，用于未来动态注册新组件
  registerComponent: (name: string, componentConfig: ComponentConfig) => void;
}

/**
 * @description 将物料数组 `materials` 转换为以组件名称为键(key)的映射表(Map)。
 * 这种数据结构变换是为了后续能够通过组件名（如 "Button"）进行 O(1) 时间复杂度的快速查找，
 * 而不是每次都去遍历整个数组。
 *
 * @example
 * // 转换前 (materials 数组):
 * // [
 * //   { name: 'Button', desc: '按钮', ... },
 * //   { name: 'Container', desc: '容器', ... }
 * // ]
 *
 * // 转换后 (componentConfigMap 对象):
 * // {
 * //   'Button': { name: 'Button', desc: '按钮', ... },
 * //   'Container': { name: 'Container', desc: '容器', ... }
 * // }
 */
const componentConfigMap = materials.reduce(
  (acc, curr) => {
    // 核心操作：将当前组件的配置对象 `curr`，存入累加器 `acc` 中。
    // 使用当前组件的 `name` 属性 (如 "Button") 作为 `key`。
    acc[curr.name] = curr;

    // 必须返回累加器 `acc`，这样下一次迭代才能在上一次的基础上继续添加。
    return acc;
  },
  {} as { [key: string]: ComponentConfig }
);

export const useComponentConfigStore = create<State & Action>((set) => ({
  componentConfig: componentConfigMap,
  registerComponent: (name, componentConfig) =>
    set((state) => {
      return {
        ...state,
        componentConfig: {
          ...state.componentConfig,
          [name]: componentConfig,
        },
      };
    }),
}));
