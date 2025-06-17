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
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

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
  resetComponents: () => void;
}

// 定义组合后的类型
type EditorStore = State & Action;

// 显式定义 creator 类型
/**
 * @description Zustand store 的创建函数。
 * 它接收 `set` 和 `get` 方法来定义 state 和 actions。
 * @param {Function} set - 用于更新 state 的函数。
 * @param {Function} get - 用于在 actions 中获取当前 state 的函数。
 */
const creator: StateCreator<EditorStore, [["zustand/immer", never]]> = (
  set,
  get
) => ({
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

  updateComponentStyles: (ComponentId, styles, replace = false) => {
    set((state) => {
      const component = getComponentById(ComponentId, state.components);
      if (component) {
        // `replace` 参数决定是覆盖样式还是合并样式
        component.styles = replace
          ? { ...styles }
          : { ...component.styles, ...styles };
        return;
      }
      return;
    });
  },

  setCurComponentId: (comId) => {
    set((state) => {
      state.curComponentId = comId;
      state.curComponent = getComponentById(comId, state.components);
    });
  },

  addComponent: (component, parentId) => {
    set((state) => {
      const newComponent = structuredClone(component);
      if (parentId) {
        const parent = getComponentById(parentId, state.components);
        if (parent) {
          if (!parent.children) parent.children = [];
          newComponent.parentId = parentId;
          parent.children.push(newComponent);
        }
      } else {
        state.components.push(newComponent);
      }
    });
  },

  deleteComponent: (componentId) => {
    set((state) => {
      const component = getComponentById(componentId, state.components);

      if (!component) return;

      if (component.parentId) {
        // ✅ 从父节点 children 删除
        const parent = getComponentById(component.parentId, state.components);
        if (parent?.children) {
          parent.children = parent.children.filter((c) => c.id !== componentId);
        }
      } else {
        // ✅ 没有 parentId，说明是根组件，直接从顶层删除
        state.components = state.components.filter((c) => c.id !== componentId);
      }

      // ✅ 删除当前选中组件
      if (state.curComponentId === componentId) {
        state.curComponentId = null;
        state.curComponent = null;
      }
    });
  },

  updateComponentProps: (componentId, props) => {
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (component) {
        component.props = { ...component.props, ...props };
        return;
      }
      return;
    });
  },

  resetComponents: () => {
    set((state) => {
      state.components = [
        {
          id: 1,
          name: "Page",
          props: {},
          desc: "页面",
        },
      ];
      state.curComponent = null;
      state.curComponentId = null;
    });
  },
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
    if (component.id === id) return component;
    const result = getComponentById(id, component.children ?? []);
    if (result) return result;
  }
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

/**
 * @description 使用 `create` + 多中间件创建 store
 */
export const useComponetsStore = create<EditorStore>()(
  temporal(
    // 1. temporal 在外层
    persist(
      // 2. persist 在内层
      immer(creator), // 3. immer 在最核心
      {
        name: "store", // persist 的配置
        // persist 只持久化核心业务状态
        partialize: (state) => ({
          components: state.components,
          // 如果需要，也可以持久化 mode, curComponentId 等
        }),
      }
    ),
    {
      // temporal 的配置
      limit: 100,
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      // temporal 也应该只关注核心状态的变化
      partialize: (state) =>
        ({
          components: state.components,
        } as unknown as EditorStore),
    }
  )
);
