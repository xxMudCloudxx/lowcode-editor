/**
 * @file Vue Action 处理器类型定义
 * @description 与 React Action 处理器共享相同接口，方便复用。
 */

import type { IModuleBuilder, IRAction } from "@lowcode/schema";
import { VueModuleBuilder } from "../../../../../utils/vue-module-builder";

/**
 * Vue Action 处理器接口
 * @param action - 当前处理的 IRAction
 * @param moduleBuilder - VueModuleBuilder 实例
 * @returns 返回生成的单行可执行代码
 */
export interface IVueActionHandler {
  (action: IRAction, moduleBuilder: VueModuleBuilder | IModuleBuilder): string;
}
