/**
 * @file Vue 调用页面方法 Action 处理器
 */

import type { IVueActionHandler } from "./type";

export const callMethodHandler: IVueActionHandler = (action) => {
  let callName = action.config.methodName; // "this.methods.open_123"

  if (callName.startsWith("this.methods.")) {
    callName = callName.substring("this.methods.".length);
  }

  return `${callName}();`;
};
