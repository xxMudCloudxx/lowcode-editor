// src/code-generator/plugins/component/react/handlers/action/default.ts

/**
 * @file 默认 Action 处理器
 * @description 当未找到特定 actionType 的处理器时，回退到此处理器并输出调试日志。
 */

import type { IActionHandler } from "./type";

/**
 * 默认 Action 处理器：将动作信息输出到控制台。
 * @param action - 当前触发的 IRAction
 * @returns 一行 `console.log` 调用代码字符串
 */
export const defaultActionHandler: IActionHandler = (action) => {
  // 默认的 console.log
  return `console.log('Action triggered: ${
    action.actionType
  }', ${JSON.stringify(action.config)});`;
};
