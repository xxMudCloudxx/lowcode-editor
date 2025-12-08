/**
 * @file component-protocol.ts
 * @description 组件协议接口定义
 *
 * 这是"协议驱动"架构的核心：
 * - 组件通过声明式 Protocol 描述自己的行为
 * - 编辑器引擎根据 Protocol 动态适配，而非硬编码
 *
 * @important 所有入网组件必须使用 forwardRef 支持 ref 转发！
 * 这是协议的强制约束，否则拖拽功能将失效。
 */

import type { ComponentType } from "react";

// ===== 设置器配置 =====

/**
 * 组件属性设置器配置
 */
export interface SetterConfig {
  name: string | string[];
  label: string;
  type:
    | "input"
    | "select"
    | "switch"
    | "radio"
    | "inputNumber"
    | "segmented"
    | "custom"
    | string;
  options?: string[] | { label: string; value: unknown }[];
  [key: string]: unknown;
}

/**
 * 组件事件配置
 */
export interface EventConfig {
  name: string;
  label: string;
}

/**
 * 组件方法配置
 */
export interface MethodConfig {
  name: string;
  label: string;
  params?: { name: string; label?: string; type: string }[];
}

// ===== 编辑器行为协议 =====

/**
 * 编辑器行为协议
 * 描述组件在编辑器画布中的行为特征
 */
export interface EditorBehavior {
  /**
   * 是否为容器组件（可接收子组件拖放）
   * @default false
   */
  isContainer?: boolean;

  /**
   * 允许作为父组件的类型列表
   * 用于拖放校验
   */
  parentTypes?: string[];

  /**
   * 编辑器内是否允许原生交互
   *
   * - false (默认): 点击事件被拦截，仅用于选中组件
   * - true: 允许原生交互（如 Tabs 切换、Collapse 展开）
   *
   * @example
   * // Button: 编辑时点击不应触发按钮，只选中
   * interactiveInEditor: false
   *
   * // Tabs: 编辑时需要点击切换标签查看不同面板
   * interactiveInEditor: true
   */
  interactiveInEditor?: boolean;

  /**
   * 组件根元素的显示类型
   * 用于 Fallback 包裹时判断使用 span 还是 div
   *
   * @default "inline"
   */
  display?: "inline" | "block" | "inline-block";

  /**
   * 自定义拖拽预览组件
   */
  dragPreview?: ComponentType<{ props: Record<string, unknown> }>;
}

// ===== 组件协议 =====

/**
 * 组件协议 - 组件与编辑器的完整通信接口
 *
 * 分为三层：
 * 1. 身份层 (name, desc, category) - 组件是谁
 * 2. 渲染层 (component, defaultProps) - 组件怎么渲染
 * 3. 编辑层 (editor, setter, events) - 组件在编辑器中怎么表现
 *
 * @important component 必须支持 ref 转发（使用 forwardRef）
 */
export interface ComponentProtocol {
  // ===== 身份层 =====
  /** 组件唯一标识 */
  name: string;
  /** 组件描述（中文名） */
  desc: string;
  /** 组件分类 */
  category?: string;

  // ===== 渲染层 =====
  /**
   * 组件实现（纯净 UI 组件）
   *
   * @important 必须使用 forwardRef 包裹，否则拖拽功能失效！
   *
   * 可以是 lazy 加载的组件
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any> | React.LazyExoticComponent<ComponentType<any>>;
  /** 默认 props */
  defaultProps: Record<string, unknown>;

  // ===== 编辑层 =====
  /** 编辑器行为配置 */
  editor: EditorBehavior;
  /** 属性设置器 */
  setter?: SetterConfig[];
  /** 样式设置器 */
  styleSetter?: SetterConfig[];
  /** 可触发事件 */
  events?: EventConfig[];
  /** 可调用方法 */
  methods?: MethodConfig[];
}

// ===== 兼容旧格式 =====

/**
 * 兼容旧的 ComponentConfig 类型
 * 用于渐进式迁移
 */
export interface LegacyComponentConfig {
  name: string;
  desc: string;
  defaultProps: Record<string, unknown>;
  category?: string;
  parentTypes?: string[];
  setter?: SetterConfig[];
  styleSetter?: SetterConfig[];
  events?: EventConfig[];
  methods?: MethodConfig[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dev?: React.LazyExoticComponent<ComponentType<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prod?: React.LazyExoticComponent<ComponentType<any>>;
}

/**
 * 统一的组件配置类型
 * 兼容新旧两种模式
 */
export type ComponentConfig = ComponentProtocol | LegacyComponentConfig;

// ===== 类型守卫 =====

/**
 * 类型守卫：判断是否为新协议格式
 */
export function isProtocolConfig(
  config: ComponentConfig
): config is ComponentProtocol {
  return "component" in config && "editor" in config;
}

// ===== 开发时校验 =====

/**
 * 开发环境下检查组件是否正确支持 ref 转发
 *
 * 调用时机：在 cloneElement 注入 ref 后，检查 ref.current 是否为有效 DOM 节点
 *
 * @param componentName 组件名称
 * @param refCurrent ref.current 的值
 */
export function validateRefForwarding(
  componentName: string,
  refCurrent: unknown
): void {
  if (process.env.NODE_ENV === "development") {
    // 延迟检查，给组件渲染完成的时间
    setTimeout(() => {
      if (refCurrent === null || refCurrent === undefined) {
        console.error(
          `[ComponentProtocol] ❌ 组件 "${componentName}" 未正确转发 ref！\n` +
            `这会导致拖拽功能失效。\n` +
            `解决方案：确保组件使用 forwardRef 包裹，并将 ref 转发到根 DOM 节点。\n` +
            `示例：\n` +
            `const ${componentName} = forwardRef<HTMLElement, Props>((props, ref) => {\n` +
            `  return <div ref={ref}>...</div>;\n` +
            `});`
        );
      }
    }, 100);
  }
}
