/**
 * @file 跳转链接 Action 处理器
 * @description 将 schema 中配置的 URL 转换为 window.open 调用，用于在新标签页中打开链接。
 */

import type { IActionHandler } from "./type";

/**
 * 生成跳转链接的调用代码。
 * @param action - 当前 IRAction，其中 `config.url` 为要打开的地址
 * @returns `window.open` 调用代码字符串
 */
export const goToLinkHander: IActionHandler = (action) => {
  const url = JSON.stringify(action.config.url);
  return `window.open(${url}, "_blank)`;
};
