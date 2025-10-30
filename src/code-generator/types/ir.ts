// src/code-generator/types/ir.ts

/**
 * @file 中间表示 (IR) 类型定义
 * @description 定义了代码生成器在解析 schema 后、生成最终代码前内部使用的数据结构。
 */

// --- 基础值类型 ---

/**
 * 字面量类型 (字符串、数字、布尔、null、普通对象/数组)
 * @description 代表可以直接在代码中使用的字面量值。
 */
export interface IRLiteral {
  type: "Literal";
  value: any; // 保留 JSON 兼容的原始值
}

/**
 * 变量引用
 * @description 代表对组件作用域内变量的引用 (例如 state 变量、循环变量)。
 */
export interface IRVariable {
  type: "Variable";
  name: string; // 变量名，如 'state.count', 'item'
}

/**
 * JS 表达式
 * @description 代表一个 JavaScript 表达式字符串。
 */
export interface IRJSExpression {
  type: "JSExpression";
  value: string; // 原始 JS 表达式字符串，如 "state.count > 0"
}

/**
 * JS 函数
 * @description 代表一个 JavaScript 函数定义的字符串形式。
 */
export interface IRJSFunction {
  type: "JSFunction";
  value: string; // 原始函数定义字符串，如 "() => { console.log('clicked'); }"
}

/**
 * 低代码平台定义的动作
 * @description 代表在低代码平台内部定义的动作 (例如，调用组件方法)。
 */
export interface IRAction {
  type: "Action";
  actionType: string; // 如 'componentMethod', 'customJS', 'navigateTo'
  config: Record<string, any>; // 保留原始配置，由特定插件处理
}

// --- 节点与页面结构 ---

/**
 * 组件依赖信息
 * @description 描述一个组件应该如何被导入。
 */
export interface IRDependency {
  /** NPM 包名 (如 'antd', '@alifd/next') 或本地路径 */
  package: string;
  /** 版本号 (可选) */
  version?: string;
  /** 是否解构导入 (import { Button } from 'antd') */
  destructuring: boolean;
  /** 导出的名称 (如果和 componentName 不同), e.g. Row in 'antd' for Grid */
  exportName?: string;
  /** 子组件名称 (如 DatePicker.RangePicker 中的 RangePicker) */
  subName?: string;
  /** 是否是主入口 (有些库需要 import 'xxx/dist/index.css') */
  main?: string | boolean;
}

/**
 * 代表一个组件节点
 * @description 在 IR 树中表示单个组件实例。
 */
export interface IRNode {
  /** 原始 Schema 中的 ID，用于调试或引用 */
  id: string | number;
  /** 组件名称 (对应 Schema 中的 name, 但可能经过映射) */
  componentName: string;
  /** 组件的属性集合 */
  props: Record<string, IRPropValue>;
  /** 子节点 */
  children?: IRNode[];
  /** 组件依赖信息 */
  dependency: IRDependency;
  /**
   * 组件的内联样式 (对应 Schema 中的 styles)
   * 后续插件可以决定是生成 style 属性还是 CSS 类
   */
  styles?: Record<string, string>;
  /**
   * 生成的 CSS 类名 (可选，如果选择生成 CSS 类)
   * 这个字段可以在生成 CSS 的插件中被填充
   */
  css?: string;

  // --- 未来可扩展字段 ---
  /** 条件渲染表达式 */
  // condition?: IRPropValue;
  /** 循环渲染的数据源 */
  // loop?: IRPropValue;
  /** 循环参数 (如 ['item', 'index']) */
  // loopArgs?: [string, string];
  /** 事件绑定 (如果不用 IRAction 的话) */
  // events?: Record<string, IRJSFunction | IRAction[]>;
  /** 节点引用标识 (ref) */
  // ref?: string;
}

/**
 * 统一的属性值类型
 * @description 用于表示 IRNode 中 props 值的各种可能性。
 */
export type IRPropValue =
  | IRLiteral
  | IRVariable
  | IRJSExpression
  | IRJSFunction
  | IRAction
  | IRNode // 用于处理 Slot 或 Render Props
  | IRNode[]; // 用于处理 Slot 或 Render Props (列表)

/**
 * 代表一个页面
 */
export interface IRPage {
  /** 页面 ID */
  id: string | number;
  /** 页面文件名 (不含扩展名, e.g., 'index') */
  fileName: string;
  /** 页面的根节点 */
  node: IRNode;
  /** 页面级别的状态定义 (未来扩展) */
  // state?: Record<string, IRLiteral | IRJSExpression>;
  /** 页面级别的方法 (未来扩展) */
  // methods?: Record<string, IRJSFunction>;
  /** 页面生命周期 (未来扩展) */
  // lifeCycles?: {
  //   componentDidMount?: IRJSFunction;
  //   componentWillUnmount?: IRJSFunction;
  // };
  /** 页面需要导入的依赖 (由解析器收集) */
  dependencies: IRDependency[];
}

/**
 * 代表整个项目
 */
export interface IRProject {
  /** 页面列表 */
  pages: IRPage[];
  /** 项目全局状态 (未来扩展) */
  // globalState?: Record<string, IRLiteral | IRJSExpression>;
  /** 项目工具函数 (未来扩展) */
  // utils?: { name: string, content: IRJSFunction }[];
  /** 全局常量 (未来扩展) */
  // constants?: Record<string, IRLiteral>;
  /** 全局样式 */
  globalStyles?: string; // 可以是 CSS 字符串或文件路径
  /** 项目所有依赖 (用于生成 package.json) e.g., { 'antd': '^5.0.0', 'react': '^18.0.0' } */
  dependencies: Record<string, string>;
}

// --- Schema 类型 ---

/**
 * 输入的 Schema 节点结构 (简化定义)
 * @description 为了类型检查，最好也定义一下 Schema 结构。
 */
export interface ISchemaNode {
  id: number | string;
  name: string; // 组件名，如 'Page', 'Grid', 'Button'
  props?: Record<string, any>;
  children?: ISchemaNode[];
  styles?: Record<string, string>;
  desc?: string; // 描述信息，可忽略
  parentId?: number | string; // 可忽略，IR 中通过层级关系体现
  // onClick?: { actions: any[] }; // 我的 Schema 中事件的结构
  [key: string]: any; // 其他可能的字段
}

/**
 * 输入的 Schema 结构 (假设输入是一个节点数组)
 */
export type ISchema = ISchemaNode[];
