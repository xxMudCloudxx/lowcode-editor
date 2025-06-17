/**
 * @file /src/editor/stores/components.tsx
 * @description
 * 使用 Zustand 管理编辑器画布中的所有组件实例状态。
 * 这个 store 是整个应用的核心数据中心，负责：
 * - 存储画布上所有组件的树状结构 (components)
 * - 管理当前选中的组件 (curComponentId, curComponent)
 * - 控制编辑/预览模式 (mode)
 * - 提供对组件进行 CRUD (增删改查) 操作的 actions
 * - 通过多中间件组合 (temporal, persist, immer) 实现状态的时间旅行（撤销/重做）、持久化和不可变更新。
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

/**
 * @description Zustand store 的核心创建逻辑。
 * 它接收 `set` 方法来定义 state 和 actions，并被 immer 中间件包裹。
 * @param {Function} set - immer 中间件提供的 set 函数，允许直接修改 draft state。
 */
const creator: StateCreator<EditorStore, [["zustand/immer", never]]> = (
  set
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
      if (!component) return;

      // `replace` 参数决定是覆盖样式还是合并样式
      component.styles = replace
        ? { ...styles }
        : { ...component.styles, ...styles };

      // 关键: 保持 curComponent (数据副本) 与 components的同步
      if (state.curComponent?.id === ComponentId) {
        state.curComponent = component;
      }
    });
  },

  setCurComponentId: (comId) => {
    // 在状态更新前，明确地【暂停】历史记录
    useComponetsStore.temporal.getState().pause();
    set((state) => {
      state.curComponentId = comId;
      // 关键: 更新 ID 的同时，更新 curComponent 这个数据副本
      state.curComponent = getComponentById(comId, state.components);
    });

    // 状态更新后，立即【恢复】历史记录，以便后续的“写”操作可以被正常追踪
    useComponetsStore.temporal.getState().resume();
  },

  addComponent: (component, parentId) => {
    set((state) => {
      // 使用 structuredClone 创建一个深拷贝，确保新添加的对象是纯净的
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

      // 从其父组件的 children 数组中移除
      if (component.parentId) {
        const parent = getComponentById(component.parentId, state.components);
        if (parent?.children) {
          parent.children = parent.children.filter((c) => c.id !== componentId);
        }
      } else {
        // 如果没有 parentId，说明是根组件，直接从顶层删除
        state.components = state.components.filter((c) => c.id !== componentId);
      }

      // 关键: 如果删除的是当前选中的组件，需要同步清空选中状态
      if (state.curComponentId === componentId) {
        state.curComponentId = null;
        state.curComponent = null;
      }
    });
  },

  updateComponentProps: (componentId, props) => {
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (!component) return;

      component.props = { ...component.props, ...props };

      // 关键: 保持 curComponent (数据副本) 与 components的同步
      if (state.curComponent?.id === componentId) {
        state.curComponent = component;
      }
    });
  },

  resetComponents: () => {
    set((state) => {
      // 重置时，需要将所有相关状态都恢复到初始值
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
    if (component.id === id) {
      return component;
    }

    if (component.children && component.children.length > 0) {
      const result = getComponentById(id, component.children);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * @description 检查一个组件是否是另一个组件的后代。
 *  * 通过从 "childId" 开始，沿着 parentId 向上追溯，看是否能找到 "ancestorId"。
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
 * @description 创建最终的 store 实例，并组合使用多个中间件。
 * 中间件的包裹顺序非常重要，通常遵循“从内到外”的执行逻辑：
 * 1. `immer`: 在最内层，让我们可以用“可变”的方式写出“不可变”的更新逻辑。
 * 2. `persist`: 包裹 `immer`，将状态持久化到 localStorage。
 * 3. `temporal`: 在最外层，为整个状态（包括持久化的部分）增加撤销/重做能力。
 */
export const useComponetsStore = create<EditorStore>()(
  temporal(
    persist(immer(creator), {
      name: "lowcode-store", // 为持久化存储指定一个唯一的名称
      // 使用 partialize 函数，只持久化核心业务状态，避免不必要或瞬时的数据（如 curComponent）被保存
      partialize: (state) => ({
        components: state.components,
        // TIPS: 如果需要，也可以持久化 mode, curComponentId 等
      }),
    }),
    {
      // temporal (zundo) 的配置
      limit: 100, // 最多记录100步历史
      // 同样只让 temporal 关注核心的 components 变化
      partialize: (state) => {
        return {
          components: state.components,
        };
      },
    }
  )
);

/**
 * @description 订阅 store 的状态变化，以处理撤销/重做等操作触发的副作用。
 * 这是连接“历史状态”和“当前UI状态”的关键桥梁，用于处理状态不同步的问题。
 */
useComponetsStore.subscribe(
  // `subscribe` 的回调会接收到最新的 state 和变化前的 prevState
  (state, prevState) => {
    // 我们只关心之前有组件被选中的情况
    if (prevState.curComponentId) {
      // 检查之前被选中的组件，在【新】的状态树里是否还存在
      const componentStillExists = getComponentById(
        prevState.curComponentId,
        state.components // 使用最新的 components 状态
      );

      // 如果组件在新状态里不见了（说明它被删除了，无论是通过 delete 还是 redo/undo）
      if (!componentStillExists) {
        // 那么就清空当前选中的ID，避免产生“幽灵选中”的 bug
        // 使用 setTimeout(..., 0) 将此更新推入下一个事件循环，以避免在当前更新流程中直接修改 state 引发冲突
        setTimeout(() => {
          useComponetsStore.getState().setCurComponentId(null);
        }, 0);
      }
    }
  }
);
