// src/code-generator/plugins/component/react/handlers/action/default.ts
import type { IActionHandler } from "./type";

export const defaultActionHandler: IActionHandler = (action) => {
  // 默认的 console.log
  return `console.log('Action triggered: ${
    action.actionType
  }', ${JSON.stringify(action.config)});`;
};
