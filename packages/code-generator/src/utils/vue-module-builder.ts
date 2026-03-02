/**
 * @file Vue SFC 模块构建器
 * @description 实现 IModuleBuilder 接口，用于构建 Vue 3 单文件组件（.vue）。
 *              生成 <script setup lang="ts"> + <template> + <style scoped> 三段式结构。
 */

import type { IRDependency, IModuleBuilder } from "@lowcode/schema";
import { kebabCase } from "lodash-es";

/**
 * 导入语句接口（与 React ModuleBuilder 共用同一结构）
 */
interface IImport {
  imported: string;
  source: string;
  original?: string;
  destructuring: boolean;
}

/**
 * Vue 单文件组件模块构建器
 * @description 收集导入、状态、方法、模板和样式，最终生成 .vue SFC 文件内容。
 */
export class VueModuleBuilder implements IModuleBuilder {
  /** 存储导入语句，Key 为 'imported@source' */
  private imports: Map<string, IImport> = new Map();
  /** 存储 <template> 内容 */
  private template: string = "";
  /** 存储方法定义 */
  private methods: string[] = [];
  /** 存储响应式状态定义 */
  private state: string[] = [];
  /** 存储生命周期 / watcher 等副作用 */
  private effects: string[] = [];
  /** 存储 scoped CSS 类 */
  private cssClasses: Map<string, Record<string, string>> = new Map();

  /**
   * 添加一个导入语句。
   * @description 自动将 `antd` 包映射为 `ant-design-vue`，
   *              将 `@ant-design/icons` 映射为 `@ant-design/icons-vue`。
   */
  addImport(dep: IRDependency, componentName: string): string {
    if (!dep.package) return componentName;

    // 框架适配：将 React 生态的包名映射为 Vue 对应版本
    let source = dep.package;
    if (source === "antd") {
      source = "ant-design-vue";
    } else if (source === "@ant-design/icons") {
      source = "@ant-design/icons-vue";
    }

    const importName = dep.exportName || componentName;
    const key = `${importName}@${source}`;

    if (!this.imports.has(key)) {
      this.imports.set(key, {
        imported: importName,
        source,
        destructuring: dep.destructuring,
        original:
          dep.exportName && dep.exportName !== componentName.split(".")[0]
            ? componentName.split(".")[0]
            : undefined,
      });
    }

    return componentName;
  }

  /**
   * 添加 Vue 框架导入（对应 IModuleBuilder.addReactImport）。
   * @description 虽然接口名为 addReactImport，但 Vue 实现从 'vue' 包导入。
   *              同时将 React Hook 名自动映射为 Vue Composition API 等价物。
   */
  addReactImport(imported: string): string {
    // React → Vue 自动映射表
    const vueMapping: Record<string, string> = {
      useState: "ref",
      useEffect: "onMounted",
      useMemo: "computed",
      useCallback: "computed",
      useRef: "ref",
    };

    const vueImport = vueMapping[imported] || imported;
    const key = `${vueImport}@vue`;

    if (!this.imports.has(key)) {
      this.imports.set(key, {
        imported: vueImport,
        source: "vue",
        destructuring: true,
      });
    }

    return vueImport;
  }

  /**
   * 添加 Vue 专用导入（如 ref, computed, onMounted 等）。
   * @description 这是 Vue 构建器特有的便捷方法，Vue 组件插件优先使用此方法。
   */
  addVueImport(imported: string): string {
    const key = `${imported}@vue`;
    if (!this.imports.has(key)) {
      this.imports.set(key, {
        imported,
        source: "vue",
        destructuring: true,
      });
    }
    return imported;
  }

  /**
   * 设置 <template> 内容。
   */
  setJSX(templateString: string): void {
    this.template = templateString;
  }

  /**
   * 添加方法定义到 <script setup> 中。
   */
  addMethod(methodString: string): void {
    this.methods.push(methodString);
  }

  /**
   * 添加响应式状态定义到 <script setup> 中。
   * @description Vue 中应使用 ref() / reactive() 声明。
   */
  addState(stateString: string): void {
    this.state.push(stateString);
  }

  /**
   * 添加副作用（onMounted / watch 等）到 <script setup> 中。
   */
  addEffect(effectString: string): void {
    this.effects.push(effectString);
  }

  /**
   * 注册一个 CSS 类及其样式（用于生成 <style scoped>）。
   */
  addCssClass(className: string, styles: Record<string, string>): void {
    this.cssClasses.set(className, styles);
  }

  /**
   * 生成 scoped CSS 内容。
   * @description Vue 使用 <style scoped>，不需要 CSS Modules，
   *              因此这里生成的内容会内嵌到 .vue 文件中。
   */
  generateCssModule(_componentName?: string): string {
    if (this.cssClasses.size === 0) return "";

    const rules: string[] = [];
    this.cssClasses.forEach((styles, className) => {
      const rulesString = Object.keys(styles)
        .map((key) => `  ${kebabCase(key)}: ${styles[key]};`)
        .join("\n");
      rules.push(`.${className} {\n${rulesString}\n}`);
    });

    return rules.join("\n\n");
  }

  /**
   * 生成完整的 Vue SFC 文件内容。
   * @param _moduleName - 模块名（Vue SFC 不需要在文件内声明组件名）
   * @returns 完整的 .vue 文件字符串
   */
  generateModule(_moduleName: string): string {
    const importStatements = this.generateImportStatements();
    const stateStr = this.state.join("\n");
    const effectStr = this.effects.join("\n\n");
    const methodStr = this.methods.join("\n\n");
    const cssContent = this.generateCssModule();

    // 构建 <script setup> 代码块
    const scriptParts: string[] = [];
    if (importStatements) scriptParts.push(importStatements);
    if (stateStr) scriptParts.push(`// --- 响应式状态 ---\n${stateStr}`);
    if (effectStr) scriptParts.push(`// --- 副作用 ---\n${effectStr}`);
    if (methodStr) scriptParts.push(`// --- 方法 ---\n${methodStr}`);

    const scriptContent = scriptParts.join("\n\n");

    // 组装 SFC
    let sfc = `<!-- 此文件由低代码平台自动生成，请勿直接修改 -->
<script setup lang="ts">
${scriptContent}
</script>

<template>
${this.template || "  <div>Empty Component</div>"}
</template>`;

    if (cssContent) {
      sfc += `

<style scoped>
${cssContent}
</style>`;
    }

    return sfc + "\n";
  }

  /**
   * 根据收集的导入信息生成 import 语句。
   * @description 合并同一来源的导入，排序以保证一致性。
   */
  private generateImportStatements(): string {
    const importsBySource: Record<
      string,
      { defaultImport?: string; namedImports: Set<string> }
    > = {};

    this.imports.forEach((imp) => {
      if (!importsBySource[imp.source]) {
        importsBySource[imp.source] = { namedImports: new Set() };
      }
      if (imp.destructuring) {
        importsBySource[imp.source].namedImports.add(
          imp.original ? `${imp.original} as ${imp.imported}` : imp.imported,
        );
      } else {
        importsBySource[imp.source].defaultImport = imp.imported;
      }
    });

    return Object.entries(importsBySource)
      .map(([source, { defaultImport, namedImports }]) => {
        const parts: string[] = [];
        if (defaultImport) parts.push(defaultImport);
        if (namedImports.size > 0) {
          parts.push(`{ ${Array.from(namedImports).sort().join(", ")} }`);
        }
        if (parts.length === 0) return null;
        return `import ${parts.join(", ")} from '${source}';`;
      })
      .filter(Boolean)
      .sort()
      .join("\n");
  }
}
