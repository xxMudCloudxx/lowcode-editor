/**
 * @file /src/editor/stores/components.tsx
 * @description
 * 使用 Zustand 管理编辑器画布中的所有组件实例状态。
 * 这个 store 是整个应用的核心数据中心，负责：
 * - 存储画布上所有组件的树状结构 (components)
 * - 管理当前选中的组件 (curComponentId)
 * - 控制编辑/预览模式 (mode)
 * - 提供对组件进行 CRUD (增删改查) 和移动、复制/粘贴操作的 actions
 * - 通过组合 `temporal` (时间旅行)、`persist` (持久化) 和 `immer` (不可变更新) 三个中间件，实现了撤销/重做、状态本地存储和安全的 state 更新。
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
  id: number; // 组件的唯一标识符，通常是基于时间戳的自增ID
  name: string; // 组件的类型名称, 对应 component-config.tsx 中的 key
  props: any; // 传递给组件的 props，由右侧“属性”面板配置
  desc: string; // 组件的描述，用于 UI 展示（如物料名称、大纲树节点名）
  children?: Component[]; // 子组件列表，构成了组件树
  parentId?: number; // 父组件的 ID，用于实现向上追溯等逻辑
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
  clipboard: Component | null; // 剪切板状态，用于存储被复制的组件信息
}

/**
 * @interface Action
 * @description 定义了所有可以修改 state 的 actions。
 */
interface Action {
  addComponent: (Component: Component, parentId?: number) => void;
  deleteComponent: (ComponentId: number) => void;
  updateComponentProps: (
    ComponentId: number,
    props: any,
    replace?: boolean
  ) => void;
  updateComponentStyles: (
    ComponentId: number,
    styles: CSSProperties,
    replace?: boolean
  ) => void;
  setCurComponentId: (componetId: number | null) => void;
  setMode: (mode: State["mode"]) => void;
  resetComponents: () => void;
  copyComponents: (componentId: number | null) => void;
  pasteComponents: (componentId: number | null) => void;
  moveComponents: (sourId: number | null, disId: number | null) => void;
  // 全量设置组件树（用于大纲树拖拽等场景）
  setComponents: (components: Component[]) => void;
}

// 定义组合后的类型
type EditorStore = State & Action;

/**
 * @description Zustand store 的核心创建逻辑。
 * 它接收 `set` 方法来定义 state 和 actions，并被 immer 中间件包裹。
 * @param {Function} set - immer 中间件提供的 set 函数，允许直接以可变的方式修改 draft state，底层会自动处理不可变更新。
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
  curComponentId: null,
  mode: "edit",
  clipboard: null,

  // --- Actions ---

  /**
   * @description 全量更新组件树。
   * @param {Component[]} components - 新的组件树数组。
   */
  setComponents: (components) => {
    set((state) => {
      state.components = components;
    });
  },

  /**
   * @description 移动一个组件到另一个容器组件中。
   * @param {number | null} sourId - 要移动的源组件 ID。
   * @param {number | null} disId - 目标容器组件的 ID。
   */
  moveComponents(sourId, disId) {
    set((state) => {
      if (!sourId || !disId) return;
      const sourComponent = getComponentById(sourId, state.components);
      const disComponent = getComponentById(disId, state.components);
      if (!sourComponent || !disComponent) return;

      // 从其父组件的 children 数组中移除
      if (sourComponent.parentId) {
        const parent = getComponentById(
          sourComponent.parentId,
          state.components
        );
        if (parent?.children) {
          parent.children = parent.children.filter((c) => c.id !== sourId);
        }
      } else {
        // 如果没有 parentId，说明是根组件，直接从顶层删除
        state.components = state.components.filter((c) => c.id !== sourId);
      }

      // 将源组件添加到目标容器的 children 中
      if (!disComponent.children) disComponent.children = [];
      sourComponent.parentId = disId;
      disComponent.children.push(sourComponent);
    });
  },

  /**
   * @description 设置编辑器的模式。
   * @param {'edit' | 'preview'} mode - 要设置的模式。
   */
  setMode: (mode) => set({ mode }),

  /**
   * @description 更新指定组件的样式。
   * @param {number} ComponentId - 目标组件的 ID。
   * @param {CSSProperties} styles - 要更新的样式对象。
   * @param {boolean} [replace=false] - 是否完全替换现有样式。`false` (默认) 为合并，`true` 为替换。
   */
  updateComponentStyles: (ComponentId, styles, replace = false) => {
    set((state) => {
      const component = getComponentById(ComponentId, state.components);
      if (!component) return;

      // `replace` 参数决定是覆盖样式还是合并样式
      component.styles = replace
        ? { ...styles }
        : { ...component.styles, ...styles };
    });
  },

  /**
   * @description 设置当前选中的组件ID。
   * @param {number | null} comId - 要选中的组件ID，或 `null` 取消选中。
   */
  setCurComponentId: (comId) => {
    // 核心优化：在更新选中状态这种纯UI、无需撤销/重做的操作前后，
    // 明确地【暂停】和【恢复】历史记录。
    // 这可以防止这类操作污染 `temporal` 的历史栈。
    useComponetsStore.temporal.getState().pause();
    set((state) => {
      state.curComponentId = comId;
    });
    useComponetsStore.temporal.getState().resume();
  },

  /**
   * @description 向指定的父组件中添加一个新组件。
   * @param {Component} component - 要添加的组件对象。
   * @param {number} [parentId] - 目标父组件的ID。如果未提供，则添加到根级。
   */
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

  /**
   * @description 根据ID删除一个组件及其所有后代。
   * @param {number} componentId - 要删除的组件ID。
   */
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
      }
    });
  },

  /**
   * @description 更新指定组件的 props。
   * @param {number} componentId - 目标组件ID。
   * @param {any} props - 要合并的新 props 对象。
   */
  updateComponentProps: (componentId, props, replace = false) => {
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (!component) return;

      // 如果 replace 为 true，则直接替换整个 props 对象
      if (replace) {
        component.props = props;
      } else {
        // 否则，合并 props
        component.props = { ...component.props, ...props };
      }

      // 如果更新的是当前选中组件的 props，curComponent 将在 UI 层通过派生逻辑自动同步
    });
  },

  /**
   * @description 重置画布到初始状态。
   */
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
      state.curComponentId = null;
      state.clipboard = null;
    });
  },

  /**
   * @description 将指定组件复制到剪贴板。
   * @param {number | null} componentId - 要复制的组件ID。
   */
  copyComponents: (componentId) => {
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (!component) return;
      state.clipboard = component;
      // console.log(state.clipboard);
    });
  },

  /**
   * @description 将剪贴板中的组件粘贴到指定父组件下。
   * @param {number | null} parentId - 目标父组件的ID。
   */
  pasteComponents: (parentId) => {
    set((state) => {
      if (!parentId || !state.clipboard) return;
      // 从剪贴板获取模板，并用 regenerateIds 创建一个拥有全新ID的组件树副本
      const componentToPaste = regenerateIds(state.clipboard);
      const parent = getComponentById(parentId, state.components);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        componentToPaste.parentId = parentId;
        parent.children.push(componentToPaste);
      }
    });
  },
});

/**
 * @description 递归地深克隆一个组件及其所有子组件，并为每个组件生成新的唯一 ID。
 * 这是实现安全复制粘贴的核心，确保粘贴出来的组件（及其后代）拥有与原组件完全不同的身份标识。
 * @param {Component} component - 要处理的组件模板。
 * @returns {Component} - 一个拥有全新 ID 体系的组件树副本。
 */
function regenerateIds(component: Component): Component {
  const newId = generateUniqueId();

  const newComponent: Component = {
    ...component,
    id: newId,
    props: {
      ...component.props,
    },
  };

  // 如果有子组件，递归处理它们
  if (newComponent.children && newComponent.children.length > 0) {
    newComponent.children = newComponent.children.map((child) => {
      const newChild = regenerateIds(child); // 递归调用
      newChild.parentId = newComponent.id; // 关键：更新子组件的 parentId 指向新的父ID
      return newChild;
    });
  }

  return newComponent;
}

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
 * 这是实现“防循环拖拽”的关键校验逻辑。
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
 * @description 创建一个用于生成“单调递增”唯一ID的函数（工厂模式）。
 * 此函数利用了闭包的特性来维护一个内部的 `lastId` 状态。
 * 这样可以保证即使在同一毫秒内连续调用返回的生成器，ID也能持续递增，确保其在会话中的唯一性。
 * @returns {() => number} 返回一个ID生成器函数。该函数无参数，每次调用都会返回一个新的、唯一的数字ID。
 */
const createIdGenerator = () => {
  // 初始化时使用当前时间戳作为基础
  let lastId = Date.now();

  return () => {
    const newId = Date.now();

    // 如果当前时间戳小于或等于上一次生成的ID（高频调用或时钟回拨可能导致）
    if (newId <= lastId) {
      // 则在上一个ID的基础上加1，保证单调递增
      lastId++;
      return lastId;
    }

    // 否则，使用当前时间戳作为新的ID
    lastId = newId;
    return newId;
  };
};

/**
 * @description 生成一个在当前会话中唯一的、单调递增的数字ID。
 * @example
 * const id1 = generateUniqueId(); // -> 1750441208441
 * const id2 = generateUniqueId(); // -> 1750441208442 (即使在同一毫秒内调用)
 * @type {() => number}
 */
const generateUniqueId = createIdGenerator();

/**
 * @description 创建最终的 store 实例，并组合使用多个中间件。
 * 中间件的包裹顺序非常重要，遵循“从内到外”的执行逻辑：
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
      // 同样只让 temporal 关注核心的 components 变化，
      // 像 curComponentId 这类纯粹的UI状态变化不应被记录到历史中。
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
