/**
 * @file Action 处理器类型定义（框架无关）
 * @description 统一的 IActionHandler 接口，React / Vue / UniApp 共享。
 */

import type { IModuleBuilder, IRAction } from "@lowcode/schema";

export interface IActionHandlerContext {
  componentName?: string;
  componentPropsCode?: string;
}

/**
 * Action 处理器接口
 * @param action - 当前处理的 IRAction
 * @param moduleBuilder - 用于添加 imports 等
 * @returns 返回生成的单行可执行代码, e.g., "message.info('hello')"
 */
export interface IActionHandler {
  (
    action: IRAction,
    moduleBuilder: IModuleBuilder,
    context?: IActionHandlerContext,
  ): string;
}
