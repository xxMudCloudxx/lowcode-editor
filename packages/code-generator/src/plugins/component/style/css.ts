/**
 * @file CSS 模块插件（React）
 * @description 提取 irNode.styles 并将其转换为 CSS Modules 类。
 */

import type { IRPage, IModuleBuilder, IComponentPlugin } from "@lowcode/schema";
import { traverseAndExtractStyles } from "../shared/css-extractor";

const cssPlugin: IComponentPlugin = {
  type: "component",
  name: "react-css-module",

  run: (page: IRPage, moduleBuilder: IModuleBuilder) => {
    traverseAndExtractStyles(page.node, moduleBuilder);
  },
};

export default cssPlugin;
