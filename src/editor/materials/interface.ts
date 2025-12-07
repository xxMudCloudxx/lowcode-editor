// src/editor/materials/interface.ts
import type { CSSProperties, ReactNode } from "react";

/**
 * 低代码组件通用 Props
 * 包含编辑器注入的特殊属性
 */
export interface MaterialProps {
  className?: string;
  style?: CSSProperties;
  "data-component-id"?: number | string;
  children?: ReactNode;
  [key: string]: any; // 允许其余业务 Props 透传
}
