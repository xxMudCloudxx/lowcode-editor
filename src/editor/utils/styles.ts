// src/editor/utils/style.ts

/**
 * @description 移除字符串值末尾的 'px' 单位。
 */
export const stripUnit = (v?: string | number) =>
  v == null ? "" : String(v).replace(/px$/, "");

/**
 * @description 为非空字符串添加 'px' 单位。
 */
export const addUnit = (v: string) => (v === "" ? undefined : `${v}px`);
