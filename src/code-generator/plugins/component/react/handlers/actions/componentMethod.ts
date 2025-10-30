// src/code-generator/plugins/component/react/handlers/action/componentMethod.ts
import type { IActionHandler } from "./type";

export const componentMethodActionHandler: IActionHandler = (action) => {
  const targetId = action.config.componentId;
  const methodName = action.config.method;

  // 返回核心调用代码
  return `console.log('触发动作: ${action.actionType}', ${JSON.stringify(
    action.config
  )}); // TODO: Call ${methodName}() on ${targetId}`;
};
