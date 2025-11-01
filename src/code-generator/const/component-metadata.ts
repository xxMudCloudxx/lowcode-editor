// src/code-generator/const/component-metadata.ts

/**
 * @file 组件元数据常量
 * @description 定义了编辑器中使用的物料组件与其在最终代码中对应的导入信息等的映射关系。
 */

import type { IRDependency, IRLiteral, IRPropValue } from "../types/ir";

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
  //  (这是一个复杂组件)
  // --- 临时方案 (阶段一) ---
  // Icon 组件依赖 props.name 动态加载图标 (e.g., <Icon name="SmileOutlined" />)
  // 并且依赖 @ant-design/icons。
  // 在阶段一，我们的解析器还不能根据 props 动态修改导入，
  // 所以我们暂时也将其映射为 div，避免报错。
  // TODO：在后面的阶段中完善
  Icon: {
    componentName: "div", // 暂时映射为 div
    dependency: {
      package: "", // 无需导入
      destructuring: false,
    },
    isContainer: false,
  },
  // ... Card, Image, Table, Avatar, Tooltip, Radio, Slider, Switch, Upload, ...
  // ... Icon, Space, Breadcrumb, Dropdown, Menu, PageHeader, Pagination, Steps, Tabs ...
  // ... Container (可能是自定义的布局容器) ...
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
    props: Record<string, any>
  ) => Record<string, IRPropValue>;
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

// --- 3. 导出的主函数 (Public API) ---

/**
 * 获取一个组件的出码元数据 (供 JsxPlugin 调用)
 * @param componentName 组件在 Schema 中的 name (e.g., 'Typography')
 */
export function getComponentCodeGenMeta(
  componentName: string
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
