/**
 * @file /src/editor/stores/components.tsx
 * @description
 * 使用 Zustand 管理编辑器画布中的所有组件实例状态。
 * 这个 store 是整个应用的核心数据中心，负责：
 * - 存储画布上所有组件的树状结构 (components)
 * - 管理当前选中的组件 (curComponentId, curComponent)
 * - 控制编辑/预览模式 (mode)
 * - 提供对组件进行 CRUD (增删改查) 操作的 actions
 * - 通过 persist 中间件将组件状态持久化到 localStorage
 * @module Stores/Components
 */

import type { CSSProperties } from "react";
import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";

/**
 * @interface Component
 * @description 定义了画布中一个独立组件的元数据结构。
 * 这是构成组件树的基本节点。
 */
export interface Component {
  id: number; // 组件的唯一标识符，通常是时间戳
  name: string; // 组件的类型名称, 对应 component-config.tsx 中的 key
  props: any; // 传递给组件的 props
  desc: string; // 组件的描述，用于 UI 展示
  children?: Component[]; // 子组件列表，构成了组件树
  parentId?: number; // 父组件的 ID
  styles?: CSSProperties; // 应用于组件的内联样式
}

/**
 * @interface State
 * @description 定义了 store 的 state 结构。
 */
interface State {
  components: Component[]; // 画布上所有组件的根节点列表，通常只有一个 Page 组件
  mode: "edit" | "preview"; // 编辑器当前模式
  curComponentId?: number | null; // 当前选中组件的 ID
  curComponent: Component | null; // 当前选中组件的完整对象，为了方便访问
}

/**
 * @interface Action
 * @description 定义了所有可以修改 state 的 actions。
 */
interface Action {
  addComponent: (Component: Component, parentId?: number) => void;
  deleteComponent: (ComponentId: number) => void;
  updateComponentProps: (ComponentId: number, props: any) => void;
  updateComponentStyles: (
    ComponentId: number,
    styles: CSSProperties,
    replace?: boolean
  ) => void;
  setCurComponentId: (componetId: number | null) => void;
  setMode: (mode: State["mode"]) => void;
}

/**
 * @description Zustand store 的创建函数。
 * 它接收 `set` 和 `get` 方法来定义 state 和 actions。
 * @param {Function} set - 用于更新 state 的函数。
 * @param {Function} get - 用于在 actions 中获取当前 state 的函数。
 */

const creator: StateCreator<State & Action> = (set, get) => ({
  components: [
    {
      id: 1,
      name: "Page",
      props: {},
      desc: "页面",
    },
  ],
  curComponent: null,
  curComponentId: null,
  mode: "edit",

  // --- Actions ---

  setMode: (mode) => set({ mode }),

  updateComponentStyles: (ComponentId, styles, replace) =>
    set((state) => {
      const component = getComponentById(ComponentId, state.components);
      if (component) {
        // `replace` 参数决定是覆盖样式还是合并样式
        component.styles = replace
          ? { ...styles }
          : { ...component.styles, ...styles };
        // 重点：返回一个新的数组引用来触发 React 的重渲染
        return { components: [...state.components] };
      }

      return { components: [...state.components] };
    }),

  setCurComponentId: (comId) =>
    set((state) => ({
      curComponent: getComponentById(comId, state.components),
      curComponentId: comId,
    })),

  addComponent: (component, parentId) =>
    set((state) => {
      // 如果提供了 parentId，则将组件添加到父组件的 children 中
      if (parentId) {
        const parentComponent = getComponentById(parentId, state.components);

        if (parentComponent) {
          if (parentComponent.children) {
            parentComponent.children.push(component);
          } else {
            // 如果父组件之前没有 children，则创建它
            parentComponent.children = [component];
          }
        }

        component.parentId = parentId;
        return { components: [...state.components] };
      }
      // 如果没有 parentId，则添加到根级（虽然此项目逻辑中很少见）
      return { components: [...state.components, component] };
    }),

  deleteComponent: (componentId) => {
    if (!componentId) return;

    const component = getComponentById(componentId, get().components);
    if (component?.parentId) {
      // 关键：要删除一个组件，需要先找到它的父组件
      const parentComponent = getComponentById(
        component.parentId,
        get().components
      );

      if (parentComponent) {
        // 从父组件的 children 数组中过滤掉要删除的组件
        parentComponent.children = parentComponent?.children?.filter(
          (item) => item.id !== +componentId
        );

        set({ components: [...get().components] });
      }
    }
  },

  updateComponentProps: (componentId, props) =>
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (component) {
        // 合并旧的 props 和新的 props
        component.props = { ...component.props, ...props };

        return { components: [...state.components] };
      }

      return { components: [...state.components] };
    }),
});

/**
 * @description 递归地从组件树中根据 ID 查找并返回组件对象。
 * @param {number | null} id - 要查找的组件 ID。
 * @param {Component[]} components - 当前要搜索的组件数组（或子树）。
 * @returns {Component | null} - 找到的组件对象，如果未找到则返回 null。
 */
export function getComponentById(
  id: number | null,
  components: Component[]
): Component | null {
  if (id === null) return null;

  for (const component of components) {
    // 1. 检查当前层的组件
    if (component.id === id) return component;

    // 2. 如果当前层没找到，递归搜索其子组件
    const result = getComponentById(id, component.children ?? []);
    if (result) return result;
  }

  // 遍历完所有节点都未找到，返回 null
  return null;
}

/**
 * @description 【新增】检查一个组件是否是另一个组件的后代。
 * 通过从 "childId" 开始，沿着 parentId 向上追溯，看是否能找到 "ancestorId"。
 * @param {number} childId - “后代”组件的 ID。
 * @param {number} ancestorId - “祖先”组件的 ID。
 * @param {Component[]} components - 完整的组件树。
 * @returns {boolean} - 如果是后代，则返回 true，否则返回 false。
 */
export function isDescendantOf(
  childId: number,
  ancestorId: number,
  components: Component[]
): boolean {
  let current = getComponentById(childId, components);

  // 向上遍历父节点
  while (current && current.parentId) {
    if (current.parentId === ancestorId) {
      return true; // 找到了祖先
    }
    current = getComponentById(current.parentId, components);
  }

  return false; // 遍历到根节点都未找到
}

// 使用 `create` 函数创建 store
export const useComponetsStore = create<State & Action>()(
  // 使用 persist 中间件来包裹 creator
  persist(creator, {
    name: "store", // 在 localStorage 中存储的 key
  })
);
