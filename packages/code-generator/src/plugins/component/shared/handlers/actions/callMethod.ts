/**
 * @file 调用页面方法的 Action 处理器（框架无关）
 * @description 将 state-lifter 注入的 callMethod action 转换为可执行的 JS 调用代码字符串。
 */

import type { IActionHandler } from "./type";

/**
 * 生成调用页面方法的代码字符串。
 * @param action - 当前 IRAction，`config.methodName` 为方法名（如 `"handleOpen_modal_100"`）
 * @returns 方法调用代码，例如 `"handleOpen_modal_100();"`
 */
export const callMethodHandler: IActionHandler = (action) => {
  const callName = action.config.methodName;

  // 返回实际的 JS 调用代码
  return `${callName}();`;
};
