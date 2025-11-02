// src/code-generator/plugins/component/react/handlers/action/index.ts
import type { IActionHandler } from "./type";
import { showMessageActionHandler } from "./showMessage";
import { defaultActionHandler } from "./default";
import { goToLinkHander } from "./goToLink";
import { callMethodHandler } from "./callMethod";

// Action 处理器注册表
const actionHandlers: Record<string, IActionHandler> = {
  showMessage: showMessageActionHandler,
  goToLink: goToLinkHander,
  callMethod: callMethodHandler,
  // ... 未来在这里添加新的 Action 处理器
  // --- 扩展点 ---
  // 当未来需要支持 navigateTo 时, 只需：
  // 1. 创建 navigateTo.ts
  // 2. 在这里导入 import { navigateToActionHandler } from "./navigateTo";
  // 3. 在下面添加一行 "navigateTo": navigateToActionHandler,
  // 4. jsx.ts 无需任何改动。
};

/**
 * 获取指定 actionType 的处理器
 * @param actionType
 * @returns {IActionHandler}
 */
export function getActionHandler(actionType: string): IActionHandler {
  return actionHandlers[actionType] || defaultActionHandler;
}
