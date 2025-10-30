// src/code-generator/const/component-metadata.ts

/**
 * @file 组件元数据常量
 * @description 定义了编辑器中使用的物料组件与其在最终代码中对应的导入信息等的映射关系。
 */

import type { IRDependency } from "../types/ir";

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
