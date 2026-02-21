// src/code-generator/plugins/component/react/handlers/action/type.ts

/**
 * @file Action 处理器类型定义
 * @description 抽象出统一的 IActionHandler 接口，约束各类 Action 处理器的输入和输出。
 */

import type { ModuleBuilder, IRAction } from "@lowcode/schema";

/**
 * Action 处理器接口
 * @param action - 当前处理的 IRAction
 * @param moduleBuilder - 用于添加 imports 等
 * @returns {string} - 返回生成的单行可执行代码, e.g., "message.info('hello')"
 */
export interface IActionHandler {
  (action: IRAction, moduleBuilder: ModuleBuilder): string;
}
