/**
 * @file /src/editor/stores/components.tsx
 * @description
 * 使用 Zustand 管理编辑器画布中的组件数据状态。
 * 经过重构后：
 * - 只负责“画布数据”（组件实例及其层级关系）
 * - 使用范式化的 Map 结构：components: Record<number, Component>
 * - 所有读写操作都可以通过 id 在 O(1) 时间内完成
 *
 * UI 相关的瞬时状态（如 mode、curComponentId、clipboard）已经迁移到 uiStore.ts。
 */

import type { CSSProperties } from "react";
import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

import type { Component, ComponentTree } from "../interface";
import { useUIStore } from "./uiStore";

/**
 * @interface State
 * @description 组件数据层的状态结构
 */
interface State {
  /**
   * 范式化后的组件 Map：
   * - key: 组件 id
   * - value: 单个组件节点（children 只保存子节点 id）
   */
  components: Record<number, Component>;
  /**
   * 根节点 id（通常是 Page 节点）
   */
  rootId: number;
}

/**
 * @interface Action
 * @description 定义可以修改组件数据的 actions
 */
interface Action {
  /**
   * 向指定的父组件中添加一个新组件
   * @param component 组件模板（无需包含 parentId/children）
   * @param parentId 父组件 id
   */
  addComponent: (
    component: Omit<Component, "parentId" | "children">,
    parentId: number
  ) => void;

  /**
   * 删除指定组件及其所有后代
   */
  deleteComponent: (componentId: number) => void;

  /**
   * 更新组件 props
   */
  updateComponentProps: (
    componentId: number,
    props: any,
    replace?: boolean
  ) => void;

  /**
   * 更新组件样式
   */
  updateComponentStyles: (
    componentId: number,
    styles: CSSProperties,
    replace?: boolean
  ) => void;

  /**
   * 重置组件树到初始状态
   */
  resetComponents: () => void;

  /**
   * 从剪切板中粘贴组件树到指定父组件下
   */
  pasteComponents: (parentId: number | null) => void;

  /**
   * 将一个组件移动到新的父组件下
   */
  moveComponents: (sourId: number | null, disId: number | null) => void;

  /**
   * 全量设置组件树（用于大纲树拖拽、Schema 导入等场景）
   * 入参仍然是树状结构，内部会自动范式化为 Map
   */
  setComponents: (tree: ComponentTree[]) => void;
}

// 组合后的 Store 类型
export type ComponentsStore = State & Action;

// 根节点固定为 Page(id=1)
const INITIAL_ROOT_ID = 1;

const createInitialState = (): State => ({
  components: {
    [INITIAL_ROOT_ID]: {
      id: INITIAL_ROOT_ID,
      name: "Page",
      props: {},
      desc: "页面",
      parentId: null,
      children: [],
    },
  },
  rootId: INITIAL_ROOT_ID,
});

/**
 * @description Zustand store 的核心创建逻辑
 * 使用 immer 中间件包裹，允许在 set 函数中直接“可变地”修改 draft state。
 */
const creator: StateCreator<ComponentsStore, [["zustand/immer", never]]> = (
  set
) => ({
  ...createInitialState(),

  /**
   * @description 全量替换组件树（从树状结构转换为范式化 Map）
   */
  setComponents: (tree) => {
    set((state) => {
      const { map, rootId } = normalizeComponentTree(tree);
      state.components = map;
      state.rootId = rootId;
    });
  },

  /**
   * @description 向指定父组件添加一个新组件
   */
  addComponent: (component, parentId) => {
    set((state) => {
      const parent = state.components[parentId];
      if (!parent) return;

      const newComponent: Component = structuredClone(component);
      // 如果调用方未指定 id，则生成一个新的唯一 id
      if (!newComponent.id) {
        newComponent.id = generateUniqueId();
      }

      newComponent.parentId = parentId;
      newComponent.children = [];

      // 写入 Map（O(1)）
      state.components[newComponent.id] = newComponent;

      // 更新父节点的 children id 列表
      if (!parent.children) parent.children = [];
      parent.children.push(newComponent.id);
    });
  },

  /**
   * @description 删除指定组件及其所有后代
   */
  deleteComponent: (componentId) => {
    set((state) => {
      const component = state.components[componentId];
      if (!component) return;

      // 1. 从父节点 children 中移除
      if (component.parentId != null) {
        const parent = state.components[component.parentId];
        if (parent?.children) {
          parent.children = parent.children.filter((id) => id !== componentId);
        }
      }

      // 2. 递归删除所有子节点
      const deleteRecursive = (id: number) => {
        const comp = state.components[id];
        if (!comp) return;
        if (comp.children && comp.children.length > 0) {
          comp.children.forEach(deleteRecursive);
        }
        delete state.components[id];
      };

      deleteRecursive(componentId);
    });
  },

  /**
   * @description 更新指定组件的 props
   */
  updateComponentProps: (componentId, props, replace = false) => {
    set((state) => {
      const component = state.components[componentId]; // O(1) 查找
      if (!component) return;

      component.props = replace
        ? props
        : {
            ...component.props,
            ...props,
          };
    });
  },

  /**
   * @description 更新指定组件的 styles
   */
  updateComponentStyles: (componentId, styles, replace = false) => {
    set((state) => {
      const component = state.components[componentId]; // O(1) 查找
      if (!component) return;

      component.styles = replace
        ? { ...styles }
        : { ...component.styles, ...styles };
    });
  },

  /**
   * @description 重置画布到初始状态
   */
  resetComponents: () => {
    set((state) => {
      const initial = createInitialState();
      state.components = initial.components;
      state.rootId = initial.rootId;
    });

    // 同步清空 UI Store 中的选中状态和剪切板
    useUIStore.getState().setCurComponentId(null);
    useUIStore.getState().setClipboard(null);
  },

  /**
   * @description 将剪切板中的组件树粘贴到指定父组件下
   * 剪切板数据来自 UI Store，仍然是树状结构
   */
  pasteComponents: (parentId) => {
    const clipboard = useUIStore.getState().clipboard;
    if (!parentId || !clipboard) return;

    const { map: newComponentsMap, rootId } = regenerateIds(clipboard);

    set((state) => {
      const parent = state.components[parentId];
      if (!parent) return;

      // 合并新的组件 Map
      Object.assign(state.components, newComponentsMap);

      const newRoot = state.components[rootId];
      if (!newRoot) return;

      // 将新 root 挂载到目标父组件下
      newRoot.parentId = parentId;
      if (!parent.children) parent.children = [];
      parent.children.push(newRoot.id);
    });
  },

  /**
   * @description 将一个组件移动到新的父组件下
   */
  moveComponents: (sourId, disId) => {
    set((state) => {
      if (!sourId || !disId) return;
      const sourComponent = state.components[sourId];
      const disComponent = state.components[disId]; // 目标容器
      if (!sourComponent || !disComponent) return;

      // 1. 从旧父节点 children 移除
      if (sourComponent.parentId) {
        const oldParent = state.components[sourComponent.parentId];
        if (oldParent?.children) {
          oldParent.children = oldParent.children.filter((id) => id !== sourId);
        }
      }

      // 2. 添加到新父节点 children
      if (!disComponent.children) disComponent.children = [];
      disComponent.children.push(sourId);
      sourComponent.parentId = disId; // 更新 parentId
    });
  },
});

/**
 * @description 递归地从剪切板组件树中生成新的 id，并构建范式化的组件 Map
 * 返回：
 * - map: 新的 (id -> Component) 映射
 * - rootId: 新根节点的 id
 */
function regenerateIds(tree: ComponentTree): {
  map: Record<number, Component>;
  rootId: number;
} {
  const map: Record<number, Component> = {};

  const traverse = (node: ComponentTree, parentId: number | null): number => {
    const newId = generateUniqueId();

    const normalized: Component = {
      id: newId,
      name: node.name,
      props: structuredClone(node.props ?? {}),
      desc: node.desc ?? "",
      parentId,
      children: [],
      styles: node.styles ? { ...node.styles } : undefined,
    };

    map[newId] = normalized;

    if (node.children && node.children.length > 0) {
      normalized.children = node.children.map((child) =>
        traverse(child, newId)
      );
    }

    return newId;
  };

  const rootId = traverse(tree, null);

  return { map, rootId };
}

/**
 * @description 将树状结构的组件数组转换为范式化的 Map 结构
 * 通常用于：
 * - 大纲树拖拽后更新
 * - 源码面板导入 Schema
 */
function normalizeComponentTree(tree: ComponentTree[]): {
  map: Record<number, Component>;
  rootId: number;
} {
  const map: Record<number, Component> = {};
  let rootId = INITIAL_ROOT_ID;

  const traverse = (node: ComponentTree, parentId: number | null) => {
    const rawId = node.id;
    const id =
      typeof rawId === "string"
        ? Number.parseInt(rawId, 10)
        : (rawId as number);

    const normalized: Component = {
      id,
      name: node.name,
      props: node.props ?? {},
      desc: node.desc ?? "",
      parentId,
      children: [],
      styles: node.styles,
    };

    map[id] = normalized;

    if (node.children && node.children.length > 0) {
      normalized.children = node.children.map((child) => {
        const childRawId = child.id;
        return typeof childRawId === "string"
          ? Number.parseInt(childRawId, 10)
          : (childRawId as number);
      });

      node.children.forEach((child) => {
        traverse(child, id);
      });
    }
  };

  if (tree.length > 0) {
    const rawRootId = tree[0].id;
    rootId =
      typeof rawRootId === "string"
        ? Number.parseInt(rawRootId, 10)
        : (rawRootId as number);
  }

  tree.forEach((root) => traverse(root, null));

  return { map, rootId };
}

/**
 * @description 从范式化 Map 中构建树状结构（用于渲染或导出 Schema）
 * 返回一个根节点数组，目前通常只有一个 Page 根节点。
 */
export function buildComponentTree(
  components: Record<number, Component>,
  rootId: number
): ComponentTree[] {
  const buildNode = (id: number): ComponentTree | null => {
    const node = components[id];
    if (!node) return null;

    const children =
      node.children && node.children.length > 0
        ? (node.children
            .map((childId) => buildNode(childId))
            .filter(Boolean) as ComponentTree[])
        : undefined;

    return {
      id: node.id,
      name: node.name,
      props: node.props,
      desc: node.desc,
      parentId: node.parentId,
      children,
      styles: node.styles,
    };
  };

  const root = buildNode(rootId);
  return root ? [root] : [];
}

/**
 * @description 基于 Map 的 O(1) 组件查找
 */
export function getComponentById(
  id: number | null,
  components: Record<number, Component>
): Component | null {
  if (id === null) return null;
  return components[id] || null;
}

/**
 * @description 检查 childId 是否是 ancestorId 的后代
 * 通过 parentId 向上遍历链路，避免递归遍历整棵树。
 */
export function isDescendantOf(
  childId: number,
  ancestorId: number,
  components: Record<number, Component>
): boolean {
  let current = components[childId];
  while (current && current.parentId != null) {
    if (current.parentId === ancestorId) {
      return true;
    }
    current = components[current.parentId];
  }
  return false;
}

/**
 * @description 创建一个用于生成“单调递增”唯一ID的函数（工厂模式）
 * 与原实现保持一致，确保在当前会话中 id 唯一且递增。
 */
const createIdGenerator = () => {
  // 初始化时使用当前时间戳作为基础
  let lastId = Date.now();

  return () => {
    const newId = Date.now();

    // 如果当前时间戳小于或等于上一次生成的ID（高频调用或时钟回拨可能导致）
    if (newId <= lastId) {
      // 则在上一个ID的基础上加1，保证单调递增
      lastId += 1;
      return lastId;
    }

    // 否则，使用当前时间戳作为新的ID
    lastId = newId;
    return newId;
  };
};

/**
 * @description 生成一个在当前会话中唯一的、单调递增的数字ID
 */
const generateUniqueId = createIdGenerator();

/**
 * @description 创建最终的 store 实例，并组合使用多个中间件：
 * 1. immer: 允许在 set 中直接“可变”写法
 * 2. persist: 本地持久化，只存储 components 和 rootId
 * 3. temporal: 撤销/重做，只跟踪组件数据的变化
 */
export const useComponentsStore = create<ComponentsStore>()(
  temporal(
    persist(immer(creator), {
      name: "lowcode-store",
      version: 2,
      partialize: (state) => ({
        components: state.components,
        rootId: state.rootId,
      }),
      migrate: (persistedState: any) => {
        // 没有任何持久化内容：退回初始状态
        if (!persistedState || !persistedState.components) {
          const initial = createInitialState();
          return {
            components: initial.components,
            rootId: initial.rootId,
          };
        }

        // 旧版本：components 是数组（树）
        if (Array.isArray(persistedState.components)) {
          const { map, rootId } = normalizeComponentTree(
            persistedState.components as ComponentTree[]
          );
          return {
            ...persistedState,
            components: map,
            rootId: rootId ?? INITIAL_ROOT_ID,
          };
        }

        // 新版本但 rootId 丢失
        if (!persistedState.rootId) {
          return {
            ...persistedState,
            rootId: INITIAL_ROOT_ID,
          };
        }

        // 默认保持原样
        return persistedState;
      },
    }),
    {
      limit: 100,
      partialize: (state) => ({
        components: state.components,
        rootId: state.rootId,
      }),
    }
  )
);

// 向后兼容旧的拼写（避免一次性全量替换所有引用）
export const useComponetsStore = useComponentsStore;

/**
 * @description 订阅数据 Store 的变化，保证 UI Store 中的 curComponentId 始终指向存在的组件
 * 当撤销/重做或删除导致当前选中组件被移除时，自动清空选中状态。
 */
useComponentsStore.subscribe((state) => {
  const curComponentId = useUIStore.getState().curComponentId;
  if (!curComponentId) return;

  const componentStillExists = !!state.components[curComponentId];

  if (!componentStillExists) {
    // 使用 setTimeout 推迟到下一个事件循环，避免与当前更新产生冲突
    setTimeout(() => {
      useUIStore.getState().setCurComponentId(null);
    }, 0);
  }
});
