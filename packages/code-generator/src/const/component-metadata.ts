// src/code-generator/const/component-metadata.ts

/**
 * @file 组件元数据常量
 * @description 定义了编辑器中使用的物料组件与其在最终代码中对应的导入信息等的映射关系。
 */

import type { ModuleBuilder } from "@lowcode/schema";
import type {
  ICodeGenComponentMethod,
  IRDependency,
  IRLiteral,
  IRPropValue,
} from "@lowcode/schema";

/**
 * 组件元数据接口
 */
export interface IComponentMetadata {
  /** 组件在 Schema 中的名称 (name 字段) */
  componentName: string;
  /** 组件的依赖信息 */
  dependency: IRDependency;
  /** 是否是容器组件 (未来可用于优化拖拽逻辑等) */
  isContainer?: boolean;
  methods?: ICodeGenComponentMethod[];
  // 其他元数据，例如支持哪些子组件等，未来可扩展
}

/**
 * 组件元数据映射表
 * @description key 是 Schema 中的组件 name (例如 'Button', 'Grid')。
 * value 是该组件的元数据信息 (IComponentMetadata)。
 * 这个映射表是 SchemaParser 解析 schema 时查找组件对应导入信息的依据。
 * ! 将根据项目实际使用的物料组件进行填充和维护。
 */
export const componentMetadataMap: Record<string, IComponentMetadata> = {
  Page: {
    componentName: "Page",
    dependency: { package: "./components/Page", destructuring: false }, // 假设有一个本地 Page 封装
    isContainer: true, // 标记为容器
  },
  Grid: {
    componentName: "Row", // Ant Design 中 Grid 行是 Row
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "Row",
    },
    isContainer: true,
  },
  GridColumn: {
    componentName: "Col", // Ant Design 中 Grid 列是 Col
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "Col",
    },
    isContainer: true,
  },
  List: {
    componentName: "List",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true, // List 通常包含 ListItem
  },
  ListItem: {
    componentName: "List.Item", // 注意 Ant Design 的子组件用法
    // 依赖还是 'antd' 的 'List'，但使用时是 List.Item
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      subName: "Item",
      exportName: "List",
    },
    isContainer: true, // ListItem 可以包含其他组件
  },
  Typography: {
    componentName: "Typography",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    // Typography 内部不同类型（Text, Title, Paragraph）通过 props 控制，本身可视为非容器
    isContainer: false,
  },
  Form: {
    componentName: "Form",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true, // Form 包含 FormItem
  },
  FormItem: {
    componentName: "Form.Item",
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      subName: "Item",
      exportName: "Form",
    },
    isContainer: true, // FormItem 通常包含输入控件
  },
  Button: {
    componentName: "Button",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false, // Button 通常不包含其他组件，文本通过 children 或 text prop 传入
  },
  Modal: {
    componentName: "Modal",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true, // Modal 可以包含内容
    methods: [
      {
        name: "open", // 对应 editor/materials/Feedback/Modal/meta.tsx
        stateBinding: { prop: "open", value: true }, // Antd5 Modal 使用 'open' 属性
      },
      {
        name: "close", // 对应 editor/materials/Feedback/Modal/meta.tsx
        stateBinding: { prop: "open", value: false },
        eventBinding: "onCancel", // 自动将 Modal 的 onCancel 属性绑定到 close 方法
      },
      {
        // 增加 onOk 的自动绑定
        name: "handleOk",
        stateBinding: { prop: "open", value: false },
        eventBinding: "onOk", // 自动将 Modal 的 onOk 属性绑定到此方法
      },
    ],
  },
  // --- 将根据 src/editor/materials/ 下的实际组件补充 ---
  Input: {
    componentName: "Input",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false,
  },
  InputNumber: {
    componentName: "InputNumber",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false,
  },
  Select: {
    componentName: "Select",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false, // Select 的 Option 通常通过 props 配置
  },
  Space: {
    componentName: "Space",
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
    },
    isContainer: true,
  },
  Container: {
    componentName: "div", // 我们将其出码为普通的 div
    dependency: {
      package: "", // 无需导入
      destructuring: false,
    },
    isContainer: true,
  },
  Avatar: {
    componentName: "Avatar",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  Card: {
    componentName: "Card",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  Image: {
    componentName: "Image",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false,
  },
  Table: {
    componentName: "Table",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  TableColumn: {
    componentName: "TableColumn",
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "Table",
      subName: "Column",
    },
    isContainer: false,
  },
  Tooltip: {
    componentName: "Tooltip",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
    methods: [
      {
        name: "open",
        stateBinding: { prop: "open", value: true },
      },
      {
        name: "close",
        stateBinding: { prop: "open", value: false },
        // Tooltip 通常通过 onOpenChange 统一处理
        eventBinding: "onOpenChange", // 注意：onOpenChange 参数是 (open: boolean)
        // state-lifter 在处理 eventBinding 时需要适配这种情况
      },
    ],
  },
  Radio: {
    componentName: "Radio.Group",
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "Radio",
      subName: "Group",
    },
    isContainer: true,
  },
  Slider: {
    componentName: "Slider",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false,
  },
  Switch: {
    componentName: "Switch",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false,
  },
  Upload: {
    componentName: "Upload",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  Breadcrumb: {
    componentName: "Breadcrumb",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  Dropdown: {
    componentName: "Dropdown",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
    methods: [
      {
        name: "open",
        stateBinding: { prop: "open", value: true },
      },
      {
        name: "close",
        stateBinding: { prop: "open", value: false },
        eventBinding: "onOpenChange", // onOpenChange 参数是 (open: boolean)
      },
    ],
  },
  Menu: {
    componentName: "Menu",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  PageHeader: {
    componentName: "PageHeader",
    // AntD 5 中已移除 PageHeader，这里指向我们项目中的自定义封装
    dependency: {
      package: "@/components",
      destructuring: true, // 使用 default export
    },
    isContainer: false, // 实现不包含 children
  },
  Pagination: {
    componentName: "Pagination",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: false,
  },
  Steps: {
    componentName: "Steps",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  Tabs: {
    componentName: "Tabs",
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
  TabPane: {
    componentName: "Tabs.TabPane",
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "Tabs",
      subName: "TabPane",
    },
    isContainer: true,
  },
  Icon: {
    componentName: "QuestionCircleOutlined", // 这是一个逻辑名称，getTagName 将会覆盖它
    dependency: {
      package: "@ant-design/icons", // 依赖 antd 图标库
      version: "^5.0.0", // 确保版本匹配
      destructuring: true, // 我们将使用解构导入
    },
    isContainer: false,
  },
};

// --- 2. 出码元数据 (Code-Gen Metadata) ---
// (我们新增的逻辑，供 JsxPlugin 使用)

/**
 * 定义一个组件在出码阶段的“个性化”逻辑
 */
export interface ComponentCodeGenMeta {
  /**
   * 根据 Schema 中的 props，动态获取真实的组件 JSX 标签名
   * @param props Schema 节点上的 *原始* props
   * @returns 最终渲染到 JSX 的标签名, e.g., "Typography.Text"
   */
  getTagName: (props: Record<string, any>) => string;

  /**
   * 转换和过滤 props
   * 1. 过滤掉编辑器特有属性（如 visibleInEditor）
   * 2. 转换抽象属性（如 text -> children）
   * 3. 移除用于判断标签名的辅助属性（如 type）
   * @param props Schema 节点上的 *原始* props
   * @returns 真正传递给 JSX 组件的 props 对象 (IRPropValue 格式)
   */
  getTransformedProps: (
    props: Record<string, any>,
  ) => Record<string, IRPropValue>;

  /**
   * 用于生成 React Hooks (useState, useEffect) 或辅助函数。
   * @param props *原始*的 Schema props (包含 'url' 等)
   * @param moduleBuilder 用于添加 hooks, imports 等
   */
  getLogicFragments?: (
    props: Record<string, any>,
    moduleBuilder: ModuleBuilder,
  ) => void;
}

// 帮助函数：创建一个 IRLiteral 类型的 children
function createLiteralChildren(value: any): IRLiteral {
  return { type: "Literal", value };
}

// 存储所有组件的特定逻辑
const codeGenLogicMap = new Map<string, ComponentCodeGenMeta>();

// --- 在此注册所有组件的“出码逻辑” ---

// 1. 默认逻辑 (用于 Grid, GridColumn, Page 等)
const defaultLogic: ComponentCodeGenMeta = {
  getTagName: (props) => props.name, // 'name' 是 schema 节点上的
  getTransformedProps: (props) => {
    // 默认只过滤掉 Schema 传输过程中的辅助属性
    // 注意：这里的 props 是 IR 格式，我们只处理原始 props
    // 真正的 IR 转换在 SchemaParser 中完成
    // 但为了安全，我们假设 props 可能是混合的
    const { desc, parentId, id, name, ...validProps } = props;

    // 将原始 props 转换为 IRPropValue (假设它们未被转换)
    // 在一个成熟的架构中，这一步应该由 Parser 统一完成
    const irProps: Record<string, IRPropValue> = {};
    for (const key in validProps) {
      const value = validProps[key];
      if (typeof value === "object" && value !== null && "type" in value) {
        irProps[key] = value; // 已经是 IRPropValue
      } else {
        irProps[key] = { type: "Literal", value }; // 包装为 Literal
      }
    }
    return irProps;
  },
};

// 2. 为 Button 注册逻辑
codeGenLogicMap.set("Button", {
  getTagName: () => "Button",
  getTransformedProps: (props) => {
    const { desc, parentId, id, name, text, ...rest } = props;

    // 转换 text 属性为 children
    if (text) {
      rest.children = createLiteralChildren(text);
      delete rest.text; // 移除原始 text 属性
    }

    // 其余 props 保持不变 (假设已是 IRPropValue)
    return rest as Record<string, IRPropValue>;
  },
});

// 3. 为 Modal 注册逻辑 (解决 visibleInEditor 问题)
codeGenLogicMap.set("Modal", {
  getTagName: () => "Modal",
  getTransformedProps: (props) => {
    const { desc, parentId, id, name, visibleInEditor, ...validProps } = props;
    // 自动过滤掉 'visibleInEditor'
    return validProps as Record<string, IRPropValue>;
  },
});

// 4. 为 Typography 注册逻辑 (解决 type 和 content 问题)
codeGenLogicMap.set("Typography", {
  getTagName: (props) => {
    // 根据 props.type 动态决定组件标签
    // 注意：props.type 可能是 IRLiteral，也可能是原始值
    const typeProp = props.type as IRLiteral | string;
    const typeValue =
      (typeof typeProp === "object" ? typeProp.value : typeProp) || "Text"; // 默认为 Text

    switch (typeValue) {
      case "Text":
        return "Typography.Text";
      case "Title":
        return "Typography.Title";
      case "Paragraph":
        return "Typography.Paragraph";
      case "Link":
        return "Typography.Link";
      default:
        return "Typography"; // 降级
    }
  },
  getTransformedProps: (props) => {
    // 'type' 属性用于 getTagName，不应透传给组件
    // 'content' 属性转换为 'children'
    const { desc, parentId, id, name, type, content, ...rest } = props;

    if (content) {
      // 检查 content 是否已经是 IRPropValue
      if (
        typeof content === "object" &&
        content !== null &&
        "type" in content
      ) {
        rest.children = content;
      } else {
        // 否则，将其包装为 IRLiteral
        rest.children = createLiteralChildren(content);
      }
      delete rest.content; // 移除原始 content 属性
    }

    // 其余 props (如 strong, code, mark) 保持不变
    return rest as Record<string, IRPropValue>;
  },
});

// 5. 为 List/ListItem/Form/FormItem 注册逻辑 (它们使用点号调用，但 props 无需转换)
// 它们的 componentName 在解析时已处理为 "List.Item", "Form.Item"
// 但如果你的 Schema 是 {"name": "ListItem"}，你需要在这里转换
// (基于你 的文件，解析器已经做了这个工作)
// 为了保险起见，我们添加默认实现，防止 'name' 属性被错误传递

codeGenLogicMap.set("List", {
  getTagName: () => "List",
  getTransformedProps: (props) => defaultLogic.getTransformedProps(props),
});
codeGenLogicMap.set("ListItem", {
  getTagName: () => "List.Item",
  getTransformedProps: (props) => defaultLogic.getTransformedProps(props),
});
codeGenLogicMap.set("Form", {
  getTagName: () => "Form",
  getTransformedProps: (props) => defaultLogic.getTransformedProps(props),
});
codeGenLogicMap.set("FormItem", {
  getTagName: () => "Form.Item",
  getTransformedProps: (props) => defaultLogic.getTransformedProps(props),
});
codeGenLogicMap.set("Dropdown", {
  getTagName: () => "Dropdown",
  getTransformedProps: (props) => {
    const transformed = {
      ...defaultLogic.getTransformedProps(props),
    };

    const buttonTextProp = transformed.buttonText as IRLiteral | undefined;
    if (buttonTextProp && buttonTextProp.type === "Literal") {
      delete transformed.buttonText;
      if (!transformed.children && buttonTextProp.value) {
        transformed.children = createLiteralChildren(buttonTextProp.value);
      }
    }

    const triggerProp = transformed.trigger as IRLiteral | undefined;
    if (triggerProp && triggerProp.type === "Literal") {
      const triggerValue = Array.isArray(triggerProp.value)
        ? triggerProp.value
        : [triggerProp.value];
      transformed.trigger = { type: "Literal", value: triggerValue };
    }

    return transformed;
  },
});

codeGenLogicMap.set("TabPane", {
  getTagName: () => "Tabs.TabPane",
  getTransformedProps: (props) => {
    const transformed = {
      ...defaultLogic.getTransformedProps(props),
    };

    if (!transformed.key && props.id !== undefined) {
      transformed.key = createLiteralChildren(String(props.id));
    }

    return transformed;
  },
});

codeGenLogicMap.set("PageHeader", {
  getTagName: () => "PageHeader",
  getTransformedProps: (props) => {
    // 我的自定义组件 props 是 title 和 subTitle
    // 需要从 Schema 的 props 中过滤掉所有非运行时 prop
    const { desc, parentId, id, name, ...validProps } = props;
    return defaultLogic.getTransformedProps(validProps);

    // // 确保 title 和 subTitle 被正确传递
    // const transformed = {
    //   ...defaultLogic.getTransformedProps(validProps),
    // };
    // if (props.title) {
    //   transformed.title = createLiteralChildren(props.title);
    // }
    // if (props.subTitle) {
    //   transformed.subTitle = createLiteralChildren(props.subTitle);
    // }
    // return transformed;
  },
});

codeGenLogicMap.set("Icon", {
  /**
   * 1. 动态获取标签名
   */
  getTagName: (props) => {
    // props.icon 是一个 IRPropValue 对象 (IRLiteral)
    const iconProp = props.icon as IRLiteral | undefined;

    let iconName: string | undefined;
    // 检查它是否是 Literal 并且值是 string
    if (
      iconProp &&
      iconProp.type === "Literal" &&
      typeof iconProp.value === "string"
    ) {
      iconName = iconProp.value;
    }

    // 如果 icon prop 为空或不是字面量(e.g., JSExpression)，
    // 我们降级为 Antd 默认的 QuestionCircleOutlined
    return iconName || "QuestionCircleOutlined";
  },

  /**
   * 2. 负责 JSX 属性：
   */
  getTransformedProps: (props) => {
    // 过滤掉 'icon', 'type', 和其他编辑器属性
    const { desc, parentId, id, name, type, icon, ...validProps } = props;

    // 将剩余的通用 props (如 spin, style) 交给 defaultLogic 处理
    return defaultLogic.getTransformedProps(validProps);
  },

  /**
   * 3. 负责组件逻辑：
   */
  getLogicFragments: (props, moduleBuilder) => {
    // props.icon 是一个 IRPropValue 对象 (IRLiteral)
    const iconProp = props.icon as IRLiteral | undefined;

    let iconName: string | undefined;
    if (
      iconProp &&
      iconProp.type === "Literal" &&
      typeof iconProp.value === "string"
    ) {
      iconName = iconProp.value;
    }

    // [! 修正 !]
    // jsx.ts 已经导入了 "QuestionCircleOutlined" (基于 componentMetadataMap)
    // 我们只需要导入 *非默认* 的图标
    if (iconName && iconName !== "QuestionCircleOutlined") {
      moduleBuilder.addImport(
        {
          package: "@ant-design/icons",
          version: "^5.0.0",
          destructuring: true,
          exportName: iconName,
        },
        iconName, // [! 修正 !] 确保 addImport 接收正确的第二个参数
      );
    }
    // 如果是默认图标，则无需操作，jsx.ts 已经处理了
  },
});

codeGenLogicMap.set("Table", {
  // TODO：后面增加逻辑生成函数用于组件联动
  getTagName: () => "Table",
  getTransformedProps: (props) => {
    // 解构并过滤掉 'url' 属性，它仅在编辑器中使用
    const { url, ...restOfProps } = props;

    // 使用过滤掉 'url' 后的 restOfProps
    const transformed = {
      ...defaultLogic.getTransformedProps(restOfProps),
    };

    const columnsProp = transformed.columns as IRLiteral | undefined;
    if (
      columnsProp &&
      columnsProp.type === "Literal" &&
      !transformed.dataSource
    ) {
      // 如果 columns 是一个字面量数组 (来自编辑器的配置)
      // 并且没有设置 dataSource，我们自动生成一条模拟数据
      const columns = columnsProp.value || [];
      const dataSource: Record<string, any>[] = [
        columns.reduce((acc: Record<string, any>, col: any) => {
          acc[col.dataIndex] = "示例数据";
          return acc;
        }, {}),
      ];
      // 将模拟数据包装为 IRLiteral
      transformed.dataSource = createLiteralChildren(dataSource);
    }

    return transformed;
  },
});

codeGenLogicMap.set("TableColumn", {
  getTagName: () => "Table.Column",
  getTransformedProps: (props) => {
    // 1. 过滤掉编辑器特有的 'type' 属性
    const { desc, parentId, id, name, type, ...validProps } = props;

    // 2. 将所有 'validProps' (包括 title, dataIndex, key 等)
    //    交给 defaultLogic.getTransformedProps 处理。
    //    它会正确地将 "姓名" 转换为 { type: 'Literal', value: '姓名' }
    //    并且会正确地保留 { type: 'JSExpression', value: 'state.name' }
    const transformed = {
      ...defaultLogic.getTransformedProps(validProps),
    };

    // 3. (可选) 确保 key 属性存在 (AntD Table 必需)
    //    (注意：我们使用 props.id，而不是 validProps.id)
    if (props.id && !transformed.key) {
      transformed.key = createLiteralChildren(String(props.id));
    }

    return transformed;
  },
  // (getLogicFragments 将自动使用 defaultLogic 的空实现)
});

// --- 3. 导出的主函数 (Public API) ---

/**
 * 获取一个组件的出码元数据 (供 JsxPlugin 调用)
 * @param componentName 组件在 Schema 中的 name (e.g., 'Typography')
 */
export function getComponentCodeGenMeta(
  componentName: string,
): ComponentCodeGenMeta {
  const logic = codeGenLogicMap.get(componentName);

  if (logic) {
    return logic;
  }

  // 没有特定逻辑，返回一个基于 componentName 的默认逻辑
  const parserMeta = componentMetadataMap[componentName];
  const defaultTagName = parserMeta ? parserMeta.componentName : componentName;

  return {
    ...defaultLogic,
    getTagName: () => defaultTagName, // 默认使用解析器定义的 componentName
  };
}
