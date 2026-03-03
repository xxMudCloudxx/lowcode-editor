/**
 * @file Vue CSS 插件
 * @description 提取 irNode.styles 并注册到 VueModuleBuilder 中，
 *              最终生成 <style scoped> 区块。
 */

import type { IRPage, IModuleBuilder, IComponentPlugin } from "@lowcode/schema";
import { traverseAndExtractStyles } from "../shared/css-extractor";

const vueCssPlugin: IComponentPlugin = {
  type: "component",
  name: "vue-scoped-css",

  run: (page: IRPage, moduleBuilder: IModuleBuilder) => {
    traverseAndExtractStyles(page.node, moduleBuilder);
  },
};

export default vueCssPlugin;
