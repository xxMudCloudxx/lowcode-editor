// src/code-generator/plugins/component/react/handlers/action/type.ts

import type { ModuleBuilder } from "../../../../../generator/module-builder";
import type { IRAction } from "../../../../../types/ir";

/**
 * Action 处理器接口
 * @param action - 当前处理的 IRAction
 * @param moduleBuilder - 用于添加 imports 等
 * @returns {string} - 返回生成的单行可执行代码, e.g., "message.info('hello')"
 */
export interface IActionHandler {
  (action: IRAction, moduleBuilder: ModuleBuilder): string;
}
