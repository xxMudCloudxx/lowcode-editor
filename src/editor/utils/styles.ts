// src/editor/utils/style.ts

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
