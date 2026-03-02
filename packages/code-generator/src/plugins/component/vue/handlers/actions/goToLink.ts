/**
 * @file Vue 跳转链接 Action 处理器
 */

import type { IVueActionHandler } from "./type";

export const goToLinkHandler: IVueActionHandler = (action) => {
  const url = JSON.stringify(action.config.url);
  return `window.open(${url}, "_blank");`;
};
