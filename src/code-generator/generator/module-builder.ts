// src/code-generator/generator/module-builder.ts

/**
 * @file 单个代码模块构建器
 * @description 用于构建单个 TSX/JS 文件，管理导入语句、状态、方法和 JSX 内容。
 */

import type { IRDependency } from "../types/ir";
import { camelCase, kebabCase, upperFirst } from "lodash-es"; // 使用 lodash-es 或自己实现

/**
 * 导入语句接口定义
 */
export interface IImport {
  /** 导入的成员名，如 Button, useState */
  imported: string;
  /** 来源包名，如 'antd', 'react' */
  source: string;
  /** 原始导入名（如果使用了别名），如 Button as AntButton 中的 Button */
  original?: string;
  /** 是否是解构导入 { Button } vs import Button */
  destructuring: boolean;
}

/**
 * 单个代码模块（如 React 组件）的构建器类。
 */
export class ModuleBuilder {
  /** 存储导入语句，Key 为 'imported@source' */
  private imports: Map<string, IImport> = new Map();
  /** 存储生成的 JSX 字符串 */
  private jsx: string = "";
  /** 存储生成的方法定义字符串 */
  private methods: string[] = [];
  /** 存储生成的状态定义字符串 (简单示例，后续可扩展为更复杂的结构) */
  private state: string[] = [];
  /** 存储生成的 useEffect hook 字符串 */
  private effects: string[] = [];
  /**
   * @private
   * @description 存储 CSS 类名及其对应的样式规则
   * @example
   * {
   * "node_123": { "font-size": "12px", "flexDirection": "row" },
   * "node_456": { "color": "red" }
   * }
   */
  private cssClasses: Map<string, Record<string, string>> = new Map();

  /**
   * 添加一个导入语句。
   * @param dep - 组件依赖信息对象 (IRDependency)。
   * @param componentName - 组件在 IRNode 上的名称 (e.g., 'Button', 'List.Item')。
   * @returns 在代码中实际使用的组件名称 (处理了别名和子组件情况)。
   */
  addImport(dep: IRDependency, componentName: string): string {
    // 如果 package 为空（例如原生的 'div' 或 'span'），则不需要导入，直接返回组件名
    if (!dep.package) {
      return componentName;
    }

    const source = dep.package;

    // 优先使用 dep.exportName (例如 'Row')，否则使用 componentName (例如 'Button')
    let importName = dep.exportName || componentName;
    // 使用 importName@source 作为唯一标识，避免重复添加相同的导入
    const key = `${importName}@${source}`;

    if (!this.imports.has(key)) {
      this.imports.set(key, {
        imported: importName,
        source: source,
        destructuring: dep.destructuring,
        // 如果 exportName 和 componentName 不同，记录 original 以便使用 as 别名
        // 例如 Grid 的 componentName 是 'Row'，dependency.exportName 也是 'Row'，则 original 为 undefined
        // 例如 ListItem 的 componentName 是 'List.Item'，dependency.exportName 是 'List'，original 为 undefined
        // 假设有一个组件 Schema name: 'MyButton', componentName: 'AliButton', dep: { package: 'ali-ui', exportName: 'Button' }
        // 这种情况目前逻辑覆盖不到，需要更复杂的元数据配置。
        // 当前逻辑：original: (dep.exportName && dep.exportName !== componentName.split('.')[0]) ? componentName.split('.')[0] : undefined,
        // (保持原逻辑，但使用传入的 componentName)
        original:
          dep.exportName && dep.exportName !== componentName.split(".")[0]
            ? componentName.split(".")[0]
            : undefined,
      });
    }

    // 返回在 JSX 中实际使用的名称 (例如 List.Item 或 Button 或 Row)
    // 注意：irNode.componentName (即传入的 componentName) 才是 JSX 中应该使用的名称
    return componentName;
    // return dep.subName ? `${importName}.${dep.subName}` : importName; // 旧逻辑，这会导致 Grid 变成 Row.undefined
  }

  /**
   * 添加 React 相关的导入 (如 useState, useEffect)。
   * @param imported - 要导入的 React成员名 (e.g., 'useState')。
   * @returns 导入的成员名。
   */
  addReactImport(imported: string): string {
    const key = `${imported}@react`;
    if (!this.imports.has(key)) {
      this.imports.set(key, {
        imported: imported,
        source: "react",
        destructuring: true, // React hooks 通常是解构导入
      });
    }
    return imported;
  }

  /**
   * 设置模块的主要 JSX 内容。
   * @param jsxString - JSX 字符串。
   */
  setJSX(jsxString: string): void {
    this.jsx = jsxString;
  }

  /**
   * 添加一个方法定义字符串到模块中。
   * @param methodString - 方法的完整定义字符串 (e.g., `const handleClick = () => {...};`)。
   */
  addMethod(methodString: string): void {
    this.methods.push(methodString);
  }

  /**
   * 添加一个状态定义字符串到模块中。
   * @param stateString - 状态的完整定义字符串 (e.g., `const [count, setCount] = useState(0);`)。
   */
  addState(stateString: string): void {
    this.state.push(stateString);
  }

  /**
   * 添加一个 useEffect hook 字符串到模块中。
   * @param effectString - useEffect 的完整调用字符串。
   */
  addEffect(effectString: string): void {
    this.effects.push(effectString);
  }

  /**
   * @public
   * @description 注册一个 CSS 类及其样式
   * @param className - 唯一的 CSS 类名 (e.g., "node_123")
   * @param styles - 样式对象 (e.g., { "flexDirection": "row" })
   */
  public addCssClass(className: string, styles: Record<string, string>) {
    // TODO: 可以增加合并逻辑，如果同一个类名被多次添加
    this.cssClasses.set(className, styles);
  }

  /**
   * @public
   * @description 生成当前模块所有 CSS 规则的字符串
   * @param componentName - (可选) 模块名，用于生成注释
   * @returns 完整的 CSS Module 文件内容
   */
  public generateCssModule(componentName?: string): string {
    if (this.cssClasses.size === 0) {
      return "";
    }

    const header = `/**
 * @file ${componentName || "Component"} CSS Modules
 * @description 由 lowcode-editor 自动生成
 */\n\n`;

    const rules: string[] = [];
    this.cssClasses.forEach((styles, className) => {
      // 1. 将 JS 样式对象转换为 CSS 规则
      const rulesString = Object.keys(styles)
        .map((key) => `  ${kebabCase(key)}: ${styles[key]};`)
        .join("\n");

      // 2. 构造成 CSS 类
      rules.push(`.${className} {\n${rulesString}\n}`);
    });

    return header + rules.join("\n\n");
  }

  /**
   * 生成最终的模块代码字符串 (React 函数式组件)。
   * @param moduleName - 模块/组件的名称 (用于生成组件名和接口名)。
   * @returns 完整的代码字符串。
   */
  generateModule(moduleName: string): string {
    // 将 moduleName 转换为 PascalCase (首字母大写驼峰)
    const componentName = upperFirst(camelCase(moduleName));
    const propsInterfaceName = `${componentName}Props`;

    // 检查是否存在 CSS 类
    if (this.cssClasses.size > 0) {
      // 构造 CSS 模块的导入路径 (e.g., './Index.module.scss')
      const cssModuleSource = `./${componentName}.module.scss`;

      // 将 CSS 模块导入添加到 imports Map 中，
      // 稍后 generateImportStatements 将会自动处理它。
      this.imports.set(`styles@${cssModuleSource}`, {
        imported: "styles",
        source: cssModuleSource,
        destructuring: false, // 这是一个默认导入 (import styles from ...)
      });
    }

    const importStatements = this.generateImportStatements();
    // 使用空格进行缩进
    const stateStatements = this.state.map((s) => `  ${s}`).join("\n");
    const effectStatements = this.effects.map((e) => `  ${e}`).join("\n\n");
    const methodStatements = this.methods.map((m) => `  ${m}`).join("\n\n");

    // 基础的函数式组件模板
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

  /**
   * 根据收集的导入信息生成 import 语句字符串。
   * 会合并来自同一来源的导入。
   * @returns 格式化后的 import 语句字符串。
   */
  private generateImportStatements(): string {
    const importsBySource: Record<
      string,
      { defaultImport?: string; namedImports: Set<string> }
    > = {};

    // 遍历收集到的 imports，按来源 (source) 分组
    this.imports.forEach((imp) => {
      if (!importsBySource[imp.source]) {
        importsBySource[imp.source] = { namedImports: new Set() };
      }
      if (imp.destructuring) {
        // 处理别名: original ? `${original} as ${imported}` : imported
        importsBySource[imp.source].namedImports.add(
          imp.original ? `${imp.original} as ${imp.imported}` : imp.imported
        );
      } else {
        // 记录默认导入
        importsBySource[imp.source].defaultImport = imp.imported;
      }
    });

    // 生成每个来源的 import 语句
    return Object.entries(importsBySource)
      .map(([source, { defaultImport, namedImports }]) => {
        const parts: string[] = [];
        if (defaultImport) {
          parts.push(defaultImport);
        }
        if (namedImports.size > 0) {
          // 对命名导入进行排序，保证一致性
          parts.push(`{ ${Array.from(namedImports).sort().join(", ")} }`);
        }
        // 跳过没有实际导入任何内容的依赖 (例如只有类型定义的依赖)
        if (parts.length === 0) {
          return null;
        }
        return `import ${parts.join(", ")} from '${source}';`;
      })
      .filter(Boolean) // 过滤掉 null
      .sort() // 按来源包名排序，保证一致性
      .join("\n");
  }
}
