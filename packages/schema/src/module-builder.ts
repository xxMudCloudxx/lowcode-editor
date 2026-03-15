// src/code-generator/generator/module-builder.ts

/**
 * @file 单个代码模块构建器契约
 * @description 定义跨框架的模块构建接口，不包含具体框架实现。
 */

import type { IRDependency } from "./ir";

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
 * 模块构建器接口
 * @description 供 Plugin 依赖的抽象接口，不同框架（React/Vue）提供各自实现。
 */
export interface IModuleBuilder {
  /** 添加一个导入语句 */
  addImport(dep: IRDependency, componentName: string): string;
  /** 添加 React 相关的导入 (如 useState, useEffect) */
  addReactImport(imported: string): string;
  /** 设置模块的主要 JSX/模板 内容 */
  setJSX(jsxString: string): void;
  /** 添加一个方法定义字符串到模块中 */
  addMethod(methodString: string): void;
  /** 添加一个状态定义字符串到模块中 */
  addState(stateString: string): void;
  /** 添加一个 useEffect hook 字符串到模块中 */
  addEffect(effectString: string): void;
  /** 注册一个 CSS 类及其样式 */
  addCssClass(className: string, styles: Record<string, string>): void;
  /** 生成当前模块所有 CSS 规则的字符串 */
  generateCssModule(componentName?: string): string;
  /** 生成最终的模块代码字符串 */
  generateModule(moduleName: string): string;
}

