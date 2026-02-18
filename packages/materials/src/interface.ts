// src/editor/materials/interface.ts
import type { CSSProperties, ReactNode } from "react";

/**
 * 低代码组件通用 Props
 * 包含编辑器注入的特殊属性
 *
 * ⚠️ 设计说明：
 * 原本使用 [key: string]: any 作为类型兜底，这是"类型逃生舱"，
 * 会破坏 TypeScript 的类型保护。现改为使用泛型 T 来扩展组件特定属性。
 */
export interface MaterialProps {
  /** 组件类名 */
  className?: string;
  /** 组件样式 */
  style?: CSSProperties;
  /** 编辑器注入的组件 ID */
  "data-component-id"?: number | string;
  /** 子组件 */
  children?: ReactNode;
}

/**
 * 用于需要额外透传属性的组件
 * 在确实需要动态属性时使用，但请明确这是技术债务
 */
export interface MaterialPropsWithRest extends MaterialProps {
  /**
   * ⚠️ 技术债务：允许额外属性透传
   * 仅在确实需要动态属性时使用
   */
  [key: string]: unknown; // 使用 unknown 比 any 更安全
}
