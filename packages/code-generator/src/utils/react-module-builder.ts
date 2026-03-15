/**
 * @file React 模块构建器
 * @description 实现 IModuleBuilder 接口，用于生成 React TSX 页面模块和对应的 CSS Module。
 */

import type { IRDependency, IImport, IModuleBuilder } from "@lowcode/schema";
import { camelCase, kebabCase, upperFirst } from "lodash-es";

/**
 * React TSX 模块构建器
 * @description 收集导入、状态、方法、Effects、JSX 和 CSS，最终组装为单个 React 页面文件。
 */
export class ReactModuleBuilder implements IModuleBuilder {
  /** 存储导入语句，Key 为 'imported@source' */
  private imports: Map<string, IImport> = new Map();
  /** 存储生成的 JSX 字符串 */
  private jsx = "";
  /** 存储生成的方法定义字符串 */
  private methods: string[] = [];
  /** 存储生成的状态定义字符串 */
  private state: string[] = [];
  /** 存储生成的 useEffect hook 字符串 */
  private effects: string[] = [];
  /** 存储 CSS 类名及其对应的样式规则 */
  private cssClasses: Map<string, Record<string, string>> = new Map();

  addImport(dep: IRDependency, componentName: string): string {
    if (!dep.package) {
      return componentName;
    }

    const source = dep.package;
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

  addReactImport(imported: string): string {
    const key = `${imported}@react`;
    if (!this.imports.has(key)) {
      this.imports.set(key, {
        imported,
        source: "react",
        destructuring: true,
      });
    }
    return imported;
  }

  setJSX(jsxString: string): void {
    this.jsx = jsxString;
  }

  addMethod(methodString: string): void {
    this.methods.push(methodString);
  }

  addState(stateString: string): void {
    this.state.push(stateString);
  }

  addEffect(effectString: string): void {
    this.effects.push(effectString);
  }

  addCssClass(className: string, styles: Record<string, string>): void {
    this.cssClasses.set(className, styles);
  }

  generateCssModule(componentName?: string): string {
    if (this.cssClasses.size === 0) {
      return "";
    }

    const header = `/**
 * @file ${componentName || "Component"} CSS Modules
 * @description 由 lowcode-editor 自动生成
 */\n\n`;

    const rules: string[] = [];
    this.cssClasses.forEach((styles, className) => {
      const rulesString = Object.keys(styles)
        .map((key) => `  ${kebabCase(key)}: ${styles[key]};`)
        .join("\n");

      rules.push(`.${className} {\n${rulesString}\n}`);
    });

    return header + rules.join("\n\n");
  }

  generateModule(moduleName: string): string {
    const componentName = upperFirst(camelCase(moduleName));
    const propsInterfaceName = `${componentName}Props`;

    if (this.cssClasses.size > 0) {
      const cssModuleSource = `./${componentName}.module.scss`;
      this.imports.set(`styles@${cssModuleSource}`, {
        imported: "styles",
        source: cssModuleSource,
        destructuring: false,
      });
    }

    const importStatements = this.generateImportStatements();
    const stateStatements = this.state.map((s) => `  ${s}`).join("\n");
    const effectStatements = this.effects.map((e) => `  ${e}`).join("\n\n");
    const methodStatements = this.methods.map((m) => `  ${m}`).join("\n\n");

    return `/* eslint-disable */
// 此文件由低代码平台自动生成，请勿直接修改
${importStatements}

// 可以在这里引入全局 CSS 或组件自身的 CSS Module (如果需要)
// import './${moduleName}.module.css';

/**
 * 组件 Props 类型定义 (可根据需要修改)
 */
interface ${propsInterfaceName} {
  // TODO: Add component props definition if needed
}

/**
 * ${componentName} 组件
 * @description 由低代码平台生成的 React 函数式组件。
 * @param props - 组件 Props。
 * @returns React 组件实例。
 */
const ${componentName}: React.FC<${propsInterfaceName}> = (props) => {
${stateStatements ? `  // --- State --- \n${stateStatements}\n` : ""}
${effectStatements ? `  // --- Effects --- \n${effectStatements}\n` : ""}
${methodStatements ? `  // --- Methods --- \n${methodStatements}\n` : ""}
  return (
${this.jsx || "    <div>Empty Component</div>"}
  );
};

export default ${componentName};
`;
  }

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
        if (defaultImport) {
          parts.push(defaultImport);
        }
        if (namedImports.size > 0) {
          parts.push(`{ ${Array.from(namedImports).sort().join(", ")} }`);
        }
        if (parts.length === 0) {
          return null;
        }
        return `import ${parts.join(", ")} from '${source}';`;
      })
      .filter(Boolean)
      .sort()
      .join("\n");
  }
}
