/**
 * @file Vue Action 处理器注册表
 * @description 按 actionType 注册并查找对应的 Action 处理器。
 */

import type { IVueActionHandler } from "./type";
import { showMessageActionHandler } from "./showMessage";
import { defaultActionHandler } from "./default";
import { goToLinkHandler } from "./goToLink";
import { callMethodHandler } from "./callMethod";

const actionHandlers: Record<string, IVueActionHandler> = {
  showMessage: showMessageActionHandler,
  goToLink: goToLinkHandler,
  callMethod: callMethodHandler,
};

/**
 * 获取指定 actionType 的 Vue Action 处理器
 */
export function getVueActionHandler(actionType: string): IVueActionHandler {
  return actionHandlers[actionType] || defaultActionHandler;
}
