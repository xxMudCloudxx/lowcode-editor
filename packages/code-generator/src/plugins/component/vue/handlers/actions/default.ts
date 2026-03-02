/**
 * @file Vue 默认 Action 处理器 (fallback)
 */

import type { IVueActionHandler } from "./type";

export const defaultActionHandler: IVueActionHandler = (action) => {
  return `console.log('未处理的动作类型:', '${action.actionType}', ${JSON.stringify(action.config)});`;
};
