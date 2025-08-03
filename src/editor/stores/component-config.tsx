/**
 * @file /src/editor/stores/component-config.tsx
 * @description
 * 使用 Zustand 管理所有“物料组件”的配置信息。
 * 这个文件是低代码编辑器的“物料注册中心”，定义了每个组件的：
 * - 基础信息 (name, desc)
 * - 默认属性 (defaultProps)
 * - 在右侧“设置”面板中对应的属性、样式、事件、方法的配置器 (setter, styleSetter, events, methods)
 * - 在“编辑”模式下的渲染组件 (dev)
 * - 在“预览”模式下的渲染组件 (prod)
 * @module Stores/ComponentConfig
 */
import { create } from "zustand";
import { materials } from "../materials";

/**
 * @interface ComponentSetter
 * @description 定义了组件在“设置”面板中的一个配置项。
 * 它描述了如何渲染一个表单控件来修改组件的某个 prop。
 */
export interface ComponentSetter {
  name: string; // 对应组件 props 的字段名
  label: string; // 在设置面板中显示的标签
  type: string; // 决定渲染哪种类型的输入控件，如 'input', 'select', 'inputNumber'
  [key: string]: any; // 其他属性，例如 'select' 的 options
}

/**
 * @interface ComponentEvent
 * @description 定义了组件可以对外触发的事件。
 */
export interface ComponentEvent {
  name: string; // 事件名，如 'onClick'
  label: string; // 在设置面板中显示的事件标签，如 '点击事件'
}

/**
 * @interface ComponentMethod
 * @description 定义了组件可以被外部调用的方法。
 */
export interface ComponentMethod {
  name: string; // 方法名，如 'open'
  label: string; // 在设置面板中显示的方法标签，如 '打开弹窗'
  params?: Array<any>; // 某些方需要配置对应的参数
}

/**
 * @interface ComponentConfig
 * @description
 * 单个物料组件的完整配置定义。
 * 这是整个物料系统的核心数据结构。
 */
export interface ComponentConfig {
  name: string; // 组件的唯一英文名，用作类型标识
  defaultProps: Record<string, any>; // 组件被拖拽生成时的默认 props
  desc: string; // 组件的中文描述，显示在物料面板
  category?: string; // 组件分类：通用、导航、反馈、表单、数据展示、其他、布局、基础
  parentTypes?: string[]; // 组件允许接收的父组件类型列表
  setter?: ComponentSetter[]; // 属性设置器配置
  styleSetter?: ComponentSetter[]; // 样式设置器配置
  events?: ComponentEvent[]; // 事件配置
  methods?: ComponentMethod[]; // 方法配置

  // 关键设计点：区分开发和生产环境的组件渲染
  dev: React.LazyExoticComponent<React.ComponentType<any>>; // 组件在编辑器画布中的渲染形态，通常包含拖拽、选中等交互逻辑
  prod: React.LazyExoticComponent<React.ComponentType<any>>; // 组件在预览/最终发布时的真实渲染形态，是纯净的业务组件
}

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
const componentConfigMap = materials.reduce((acc, curr) => {
  // 核心操作：将当前组件的配置对象 `curr`，存入累加器 `acc` 中。
  // 使用当前组件的 `name` 属性 (如 "Button") 作为 `key`。
  acc[curr.name] = curr;

  // 必须返回累加器 `acc`，这样下一次迭代才能在上一次的基础上继续添加。
  return acc;
}, {} as { [key: string]: ComponentConfig });

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
