/**
 * @file 调用页面方法的 Action 处理器
 * @description 将 schema 中配置的 this.methods.xxx 形式的方法调用转换为可执行的 JS 调用代码字符串。
 */

import type { IActionHandler } from "./type";

/**
 * 生成调用页面方法的代码字符串。
 * @param action - 当前 IRAction，`config.methodName` 通常形如 `"this.methods.xxx"`
 * @returns 去掉 `this.methods.` 前缀后的调用代码，例如 `"open_123();"`
 */
export const callMethodHandler: IActionHandler = (action) => {
  let callName = action.config.methodName; // "this.methods.open_123"

  // 移除 "this.methods." 前缀, page 插件会处理好上下文
  if (callName.startsWith("this.methods.")) {
    callName = callName.substring("this.methods.".length);
  }

  // 返回实际的 JS 调用代码
  return `${callName}();`;
};
