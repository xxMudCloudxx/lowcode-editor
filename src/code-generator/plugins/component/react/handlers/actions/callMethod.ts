import type { IActionHandler } from "./type";

export const callMethodHandler: IActionHandler = (action) => {
  let callName = action.config.methodName; // "this.methods.open_123"

  // 移除 "this.methods." 前缀, page 插件会处理好上下文
  if (callName.startsWith("this.methods.")) {
    callName = callName.substring("this.methods.".length);
  }

  // 返回实际的 JS 调用代码
  return `${callName}();`;
};
