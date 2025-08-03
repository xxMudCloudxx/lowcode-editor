// scripts/component-map.ts

/**
 * 核心：物料地图
 * 将我们的物料组件映射到其核心依赖的 AntD 组件及其 Props 类型。
 * 这是为 react-docgen-typescript 提供精确类型信息的关键。
 */
export const COMPONENT_MAP: Record<
  string,
  { antd: string; propsType: { from: string; typeName: string } }
> = {
  Button: {
    antd: "Button",
    propsType: { from: "antd/es/button", typeName: "ButtonProps" },
  },
  Select: {
    antd: "Select",
    propsType: { from: "antd/es/select", typeName: "SelectProps<any>" },
  },
  Form: {
    antd: "Form",
    propsType: { from: "antd/es/form", typeName: "FormProps" },
  },
  Table: {
    antd: "Table",
    propsType: { from: "antd/es/table", typeName: "TableProps<any>" },
  },
  Modal: {
    antd: "Modal",
    propsType: { from: "antd/es/modal", typeName: "ModalProps" },
  },
  Input: {
    antd: "Input",
    propsType: { from: "antd/es/input", typeName: "InputProps" },
  },
  InputNumber: {
    antd: "InputNumber",
    propsType: { from: "antd/es/input-number", typeName: "InputNumberProps" },
  },
  Radio: {
    antd: "Radio.Group",
    propsType: { from: "antd/es/radio", typeName: "RadioGroupProps" },
  },
  Switch: {
    antd: "Switch",
    propsType: { from: "antd/es/switch", typeName: "SwitchProps" },
  },
  Slider: {
    antd: "Slider",
    propsType: { from: "antd/es/slider", typeName: "SliderSingleProps" },
  },
  Upload: {
    antd: "Upload",
    propsType: { from: "antd/es/upload", typeName: "UploadProps" },
  },
  Avatar: {
    antd: "Avatar",
    propsType: { from: "antd/es/avatar", typeName: "AvatarProps" },
  },
  Card: {
    antd: "Card",
    propsType: { from: "antd/es/card", typeName: "CardProps" },
  },
  Image: {
    antd: "Image",
    propsType: { from: "antd/es/image", typeName: "ImageProps" },
  },
  List: {
    antd: "List",
    propsType: { from: "antd/es/list", typeName: "ListProps<any>" },
  },
  Tooltip: {
    antd: "Tooltip",
    propsType: { from: "antd/es/tooltip", typeName: "TooltipProps" },
  },
  Breadcrumb: {
    antd: "Breadcrumb",
    propsType: { from: "antd/es/breadcrumb", typeName: "BreadcrumbProps" },
  },
  Dropdown: {
    antd: "Dropdown",
    propsType: { from: "antd/es/dropdown", typeName: "DropdownProps" },
  },
  Menu: {
    antd: "Menu",
    propsType: { from: "antd/es/menu", typeName: "MenuProps" },
  },
  Pagination: {
    antd: "Pagination",
    propsType: { from: "antd/es/pagination", typeName: "PaginationProps" },
  },
  Steps: {
    antd: "Steps",
    propsType: { from: "antd/es/steps", typeName: "StepsProps" },
  },
  Tabs: {
    antd: "Tabs",
    propsType: { from: "antd/es/tabs", typeName: "TabsProps" },
  },
  Space: {
    antd: "Space",
    propsType: { from: "antd/es/space", typeName: "SpaceProps" },
  },
  Grid: {
    antd: "Row",
    propsType: { from: "antd/es/grid", typeName: "RowProps" },
  },
  GridColumn: {
    antd: "Col",
    propsType: { from: "antd/es/grid", typeName: "ColProps" },
  },
  Typography: {
    antd: "Typography",
    propsType: { from: "antd/es/typography", typeName: "TypographyProps" },
  },
  Icon: {
    antd: "AntdIcon",
    propsType: {
      from: "@ant-design/icons/lib/components/AntdIcon",
      typeName: "AntdIconProps",
    },
  },
};
