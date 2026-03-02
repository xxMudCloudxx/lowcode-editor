/**
 * @file Vue + Vite 出码解决方案
 * @description 实现 ISolution 接口，定义 Vue 3 + Vite 5 技术栈的完整出码流水线。
 *
 * 编排完整的出码流水线：
 * 1. VueViteTemplate → 静态脚手架文件（tsconfig, vite.config, .gitignore, index.html, env.d.ts）
 * 2. ComponentPlugins → Scoped CSS 提取 + Vue Template 生成
 * 3. ProjectPlugins → 路由、入口、全局样式、运行时组件、package.json
 * 4. PostProcessors → Prettier 格式化
 * 5. Publisher → ZIP 打包下载
 *
 * 生成的 Vue 项目结构：
 * ├── index.html
 * ├── package.json
 * ├── tsconfig.json
 * ├── tsconfig.node.json
 * ├── vite.config.ts
 * ├── .gitignore
 * └── src/
 *     ├── main.ts                 # createApp 入口
 *     ├── App.vue                 # 根组件
 *     ├── env.d.ts                # 类型声明
 *     ├── assets/
 *     │   └── global.scss         # 全局样式
 *     ├── components/
 *     │   ├── Page.vue            # 运行时 Page 组件
 *     │   ├── PageHeader.vue      # 运行时 PageHeader 组件
 *     │   └── index.ts
 *     ├── router/
 *     │   └── index.ts            # Vue Router 配置
 *     └── pages/
 *         └── Index/
 *             └── Index.vue       # 页面级 SFC（<script setup> + <template> + <style scoped>）
 */

import type { ISolution, IRPage, IModuleBuilder } from "@lowcode/schema";
import type { ProjectBuilder } from "@lowcode/schema";
import { vueViteTemplate } from "../templates/vue-vite-template";
import { prettierPostProcessor } from "../postprocessor/prettier";
import { zipPublisher } from "../publisher/zip-publisher";
import { VueModuleBuilder } from "../utils/vue-module-builder";
import { camelCase, upperFirst } from "lodash-es";

// --- 组件级插件 ---
import vueTemplatePlugin from "../plugins/component/vue/template";
import vueCssPlugin from "../plugins/component/vue/css";

// --- 项目级插件 ---
import vueGlobalStylePlugin from "../plugins/project/vue/global-style";
import vueRouterPlugin from "../plugins/project/vue/router";
import vueEntryPlugin from "../plugins/project/vue/entry";
import vuePackageJsonPlugin from "../plugins/project/vue/package-json";
import vueComponentsPlugin from "../plugins/project/vue/components";

/**
 * Vue + Vite 出码方案
 */
const vueSolution: ISolution = {
  name: "vue-vite",
  description: "基于 Vue 3 + Vite 5 + TypeScript 的 SPA 项目",

  template: vueViteTemplate,

  componentPlugins: [vueCssPlugin, vueTemplatePlugin],

  projectPlugins: [
    { ...vueGlobalStylePlugin, phase: "post" as const, weight: 10 },
    { ...vueComponentsPlugin, phase: "post" as const, weight: 20 },
    { ...vueRouterPlugin, phase: "post" as const, weight: 30 },
    { ...vueEntryPlugin, phase: "post" as const, weight: 40 },
    { ...vuePackageJsonPlugin, phase: "post" as const, weight: 100 },
  ],

  postProcessors: [prettierPostProcessor()],

  publisher: zipPublisher,

  /**
   * 使用 VueModuleBuilder 替代默认的 React ModuleBuilder
   */
  createModuleBuilder: () => new VueModuleBuilder(),

  /**
   * Vue 自定义页面文件发射策略：
   * 不生成 .tsx + .module.scss，而是生成单个 .vue SFC 文件。
   */
  emitPageFiles: (ctx: {
    page: IRPage;
    moduleBuilder: IModuleBuilder;
    projectBuilder: ProjectBuilder;
    componentPascalName: string;
  }) => {
    const { moduleBuilder, projectBuilder, componentPascalName } = ctx;

    const fileName = `${componentPascalName}.vue`;
    const filePath = `src/pages/${componentPascalName}/${fileName}`;

    // VueModuleBuilder.generateModule() 返回完整的 .vue SFC 内容
    const content = moduleBuilder.generateModule(componentPascalName);

    projectBuilder.addFile({
      fileName,
      filePath,
      content,
      fileType: "other", // .vue 文件类型标记为 "other"
    });
  },
};

export default vueSolution;
