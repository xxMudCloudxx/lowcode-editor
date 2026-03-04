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
 * 代表一个组件的状态
 * @description 存储页面所需的状态。
 */

export interface IState {
  name: string; // 状态名, e.g., "modal_1761401141684_open"
  initialValue: any; // 初始值, e.g., false
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
  | IRAction[]
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

  /**
   * 页面级别的状态定义
   * (由 preprocessor/state-lifter 注入)
   * e.g., { "modal_visible_123": { type: "Literal", value: false } }
   */
  states?: Record<string, IRLiteral | IRJSExpression>;

  /**
   * 页面级别的方法定义
   * (由 preprocessor/state-lifter 注入)
   * e.g., { "openModal_123": { type: "JSFunction", value: "..." } }
   */
  methods?: Record<string, IRJSFunction>;
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

/**
 * 生成的文件对象接口
 */
export interface IGeneratedFile {
  /** 文件名 (含扩展名) */
  fileName: string;
  /** 文件在项目中的相对路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  fileType:
    | "tsx"
    | "ts"
    | "js"
    | "json"
    | "css"
    | "scss"
    | "less"
    | "html"
    | "md"
    | "other";
}
// ---方法相关接口---
/**
 * 定义一个方法的“状态绑定”
 * e.g., 'open' 方法会设置 'visible' 属性为 true
 */
export interface ICodeGenStateBinding {
  /** 目标属性名 */
  prop: string;
  /** 期望设置的值 */
  value: any;
}

/**
 * 定义组件在“出码阶段”可被调用的方法元数据
 */
export interface ICodeGenComponentMethod {
  /** 方法名 (e.g., 'open', 'close') */
  name: string;

  /**
   * 这个方法是否绑定了某个状态的变更
   */
  stateBinding?: ICodeGenStateBinding;

  /**
   * (可选) 这个方法应该自动绑定到哪个事件上 (e.g., 'onCancel')
   */
  eventBinding?: string;
}

// --- 出码描述符 (Code-Gen Descriptor) ---

/**
 * 标签名映射规则
 * @description 根据某个 prop 的值动态决定组件的 JSX 标签名。
 *
 * @example
 * // Typography 根据 type prop 映射到不同子组件
 * {
 *   prop: "type",
 *   map: {
 *     Text: "Typography.Text",
 *     Title: "Typography.Title",
 *     Paragraph: "Typography.Paragraph",
 *   },
 *   default: "Typography.Text",
 * }
 */
export interface ITagNameMapping {
  /** 根据哪个 prop 的值决定标签名 */
  prop: string;
  /** prop 值 → 标签名的映射表 */
  map: Record<string, string>;
  /** 当 prop 值不在 map 中时的兜底标签名 */
  default: string;
}

/**
 * Props 转换规则（声明式）
 * @description 描述组件在出码阶段需要进行的 prop 转换操作。
 * 所有转换由 code-generator 的通用解释器执行，物料包只需提供规则数据。
 *
 * @example
 * // Button: text → children, 同时过滤 visibleInEditor
 * {
 *   rename: { text: "children" },
 *   filter: ["visibleInEditor"],
 * }
 */
export interface IPropTransforms {
  /**
   * Prop 重命名映射
   * key: Schema 中的 prop 名, value: 出码时的 prop 名
   * @example { text: "children", content: "children" }
   */
  rename?: Record<string, string>;

  /**
   * 需要过滤掉的 prop 列表（编辑器专属、不应出现在最终代码中的 prop）
   * @example ["visibleInEditor", "desc", "parentId"]
   */
  filter?: string[];

  /**
   * 用于决定标签名的 prop 名称
   * 该 prop 会在出码时被自动过滤，不透传给组件
   * 通常与 ICodeGenDescriptor.tagName (ITagNameMapping) 配合使用
   * @example "type" // Typography 的 type prop 用于决定标签名
   */
  tagNameProp?: string;
}

/**
 * 出码描述符 — 物料与出码器之间的声明式契约
 *
 * @description
 * 每个物料组件通过此接口描述自己在出码阶段的行为：
 * - 从哪个包导入、如何导入
 * - JSX 标签名是什么（静态或动态映射）
 * - Props 需要哪些转换（重命名、过滤）
 * - 是否有状态绑定方法（如 Modal 的 open/close）
 *
 * 设计原则：
 * 1. **纯数据** — 不包含任何函数，不引用 IR 内部类型
 * 2. **物料自描述** — 由物料包提供，放在物料的 codegen.ts 文件中
 * 3. **声明式** — code-generator 的通用解释器负责执行对应逻辑
 * 4. **向下兼容** — 所有字段除 name 和 dependency 外均可选，
 *    未提供时 code-generator 使用默认行为
 *
 * @example
 * // packages/materials/src/General/Button/codegen.ts
 * const descriptor: ICodeGenDescriptor = {
 *   name: "Button",
 *   dependency: { package: "antd", version: "^5.0.0", destructuring: true },
 *   propTransforms: {
 *     rename: { text: "children" },
 *   },
 * };
 */
export interface ICodeGenDescriptor {
  /**
   * 组件在 Schema 中的唯一名称
   * 必须与 ComponentProtocol.name / ISchemaNode.name 一致
   * @example "Button", "Typography", "Modal"
   */
  name: string;

  /**
   * 组件的导入依赖信息
   * 描述该组件应该从哪个包、如何导入
   */
  dependency: IRDependency;

  /**
   * JSX 标签名
   * - string: 静态标签名 (e.g., "Button", "Form.Item")
   * - ITagNameMapping: 根据 prop 值动态映射
   * - undefined: 默认使用 dependency.exportName 或 name
   */
  tagName?: string | ITagNameMapping;

  /**
   * Props 转换规则
   * 声明式地描述 prop 的重命名、过滤等操作
   */
  propTransforms?: IPropTransforms;

  /**
   * 组件暴露的可调用方法
   * 用于 state-lifter 预处理器自动生成状态提升逻辑
   * @example Modal 的 open/close 方法
   */
  methods?: ICodeGenComponentMethod[];

  /**
   * 是否是容器组件
   * 影响出码器对子节点的处理策略
   */
  isContainer?: boolean;

  /**
   * 额外的 NPM 依赖（Peer Dependencies）
   * 某些组件可能需要额外安装的包（如 Icon 需要 @ant-design/icons）
   * 这些依赖会被添加到生成项目的 package.json 中
   * @example [{ package: "@ant-design/icons", version: "^5.0.0" }]
   */
  peerDependencies?: Array<{ package: string; version: string }>;
}
