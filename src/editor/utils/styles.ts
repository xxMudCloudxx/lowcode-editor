// src/editor/utils/style.ts

import type { CSSProperties } from "react";
import type { Direction } from "../components/common/StyleStripInputEditor";

/**
 * 移除值末尾的指定单位。
 * @param v - 需要处理的值 (字符串或数字)。
 * @param unit - 需要移除的单位 (例如 "px", "%", "rem")。
 * @returns 移除了单位的字符串。如果输入值为 null/undefined，则返回空字符串。
 */
export const stripUnit = (unit: string, v?: string | number): string => {
  // 1. 如果输入值是 null 或 undefined，直接返回空字符串
  if (v == null) {
    return "";
  }

  const valueAsString = String(v);

  // 2. 如果没有提供单位，直接返回转换后的字符串值
  if (!unit) {
    return valueAsString;
  }

  // 3. 使用 RegExp 构造函数动态创建正则表达式
  //    `${unit}$` 表示匹配以 unit 变量内容结尾的字符串
  const regex = new RegExp(`${unit}$`);

  return valueAsString.replace(regex, "");
};

/**
 * @description 为非空字符串添加 'px' 单位。
 */
export const addUnit = (unit: string, v: string) =>
  v === "" ? undefined : `${v}${unit}`;

/**
 * @description 将方向字符串的首字母大写 (e.g., 'top' -> 'Top')。
 */
export const cap = (s: any) => s[0].toUpperCase() + s.slice(1);

/**
 * @description 计算并返回单个方向条带的 CSS 样式。
 * @param {Direction} dir - 方向 ('top', 'right', 'bottom', 'left')。
 * @param {string} color - 条带的背景颜色。
 * @returns {CSSProperties} 计算出的样式对象。
 */
export function getStripStyle(
  dir: Direction,
  BAR_SIZE: number,
  WEDGE_SIZE: number,
  RETRACT: number
): CSSProperties {
  const b = BAR_SIZE,
    w = WEDGE_SIZE,
    r = RETRACT;
  const base: CSSProperties = {};
  // 使用 clip-path 属性将矩形裁剪成梯形，以实现边角斜切的视觉效果
  switch (dir) {
    case "top":
      return {
        ...base,
        top: 0,
        left: r,
        right: r,
        height: b,
        clipPath: `polygon(0 0, 100% 0, calc(100% - ${w}px) 100%, ${w}px 100%)`,
      };
    case "bottom":
      return {
        ...base,
        bottom: 0,
        left: r,
        right: r,
        height: b,
        clipPath: `polygon(${w}px 0, calc(100% - ${w}px) 0, 100% 100%, 0 100%)`,
      };
    case "left":
      return {
        ...base,
        left: 0,
        top: r,
        bottom: r,
        width: b,
        clipPath: `polygon(0 0, 100% ${w}px, 100% calc(100% - ${w}px), 0 100%)`,
      };
    case "right":
      return {
        ...base,
        right: 0,
        top: r,
        bottom: r,
        width: b,
        clipPath: `polygon(0 ${w}px, 100% 0, 100% 100%, 0 calc(100% - ${w}px))`,
      };
  }
}

// 定义从外部传入的 props 类型，key 是 kebab-case 形式
export interface KebabCaseCSSProperties {
  [key: string]: string | number | undefined;
}

/**
 * 将短横线命名（kebab-case）的字符串转换为驼峰命名（camelCase）。
 * @param str - 例如 "border-top-left-radius"
 * @returns - 例如 "borderTopLeftRadius"
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-(\w)/g, (_, c) => c.toUpperCase());
}

/**
 * 将一个对象的所有 kebab-case 键转换为 camelCase 键。
 * @param styles - 一个 key 为 kebab-case 的样式对象
 * @returns - 一个新的，key 为 camelCase 的样式对象
 */
export function convertKeysToCamelCase(styles: { [key: string]: any }): {
  [key: string]: any;
} {
  const newStyles: { [key: string]: any } = {};
  for (const key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      newStyles[kebabToCamel(key)] = styles[key];
    }
  }
  return newStyles;
}
