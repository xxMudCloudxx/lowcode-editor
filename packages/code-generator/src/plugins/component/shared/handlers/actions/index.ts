/**
 * @file Action 处理器注册表工厂（框架无关）
 * @description 提供统一的 createActionHandlerRegistry 工厂函数，
 *              按 UI 库包名创建对应的 Action 处理器查找函数。
 *
 * 使用方式：
 *   React: const getActionHandler = createActionHandlerRegistry("antd");
 *   Vue:   const getActionHandler = createActionHandlerRegistry("ant-design-vue");
 */

import type { IActionHandler } from "./type";
import { createShowMessageHandler } from "./showMessage";
import { defaultActionHandler } from "./default";
import { goToLinkHandler } from "./goToLink";
import { callMethodHandler } from "./callMethod";
import { createCustomJsHandler } from "./customJs";

export type { IActionHandler, IActionHandlerContext } from "./type";

/**
 * 创建 Action 处理器注册表
 * @param uiPackage - UI 组件库包名，用于 showMessage 等需要 UI 库导入的 handler
 * @returns 根据 actionType 查找处理器的函数
 */
export function createActionHandlerRegistry(uiPackage: string) {
  const actionHandlers: Record<string, IActionHandler> = {
    showMessage: createShowMessageHandler(uiPackage),
    customJs: createCustomJsHandler(uiPackage),
    goToLink: goToLinkHandler,
    callMethod: callMethodHandler,
    // --- 扩展点 ---
    // 新增 Action 类型时，只需在此处添加一行。
    // 所有框架（React / Vue / UniApp）自动生效。
  };

  return (actionType: string): IActionHandler =>
    actionHandlers[actionType] || defaultActionHandler;
}
