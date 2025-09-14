// src/editor/components/Setting/ComponentAttr/FormElementRenderer.tsx

import React from "react";
import {
  Input,
  Select,
  InputNumber,
  Switch,
  Radio,
  Checkbox,
  Segmented,
} from "antd";
import type { ComponentSetter } from "../../../stores/component-config";
import JsonEditor from "../../common/JsonEditor";
import { BreadcrumbSetter } from "./BreadcrumbSetter";
import AttrListSetter from "../../common/AttrListSetter";
import { normalizeOptions } from "../../../utils/formUtils";

type AnyObject = Record<string, any>;

// 自定义设置器的注册表
const customSetters: Record<string, React.FC<any>> = {
  BreadcrumbSetter,
  AttrListSetter,
};

// 定义 Props 接口，明确接收 setting 和其他所有由 FormItem 注入的 props
interface FormElementRendererProps {
  setting: ComponentSetter & AnyObject;
  [key: string]: any; // 允许接收任意其他 props, 如 value, onChange, id
}

/**
 * @description 根据 setter 配置动态渲染不同的 antd 表单组件。
 * 它现在能正确地将 Form.Item 注入的 props 传递给最终的控件。
 */
export function FormElementRenderer({
  setting,
  ...restProps
}: FormElementRendererProps) {
  // 将 setting (静态配置) 与 restProps (动态注入的 props) 分离开

  // 从静态配置中提取渲染所需的信息
  const {
    type,
    options,
    component: componentName,
    props: customSetterProps, // 这是 meta.tsx 中为 custom setter 定义的 props
  } = setting;

  // 从静态配置中提取应直接传递给 antd 控件的额外 props
  const {
    name: _omitName,
    label: _omitLabel,
    type: _omitType,
    ...controlProps
  } = setting;

  const opts = normalizeOptions(options);

  // 3. 在渲染每个控件时，将 restProps (包含 value 和 onChange) 传递下去
  switch (type) {
    case "select":
      return <Select options={opts} {...controlProps} {...restProps} />;
    case "input":
      return <Input {...controlProps} {...restProps} />;
    case "textarea":
      return (
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 8 }}
          {...controlProps}
          {...restProps}
        />
      );
    case "inputNumber":
    case "number":
      return (
        <InputNumber
          style={{ width: "100%" }}
          {...controlProps}
          {...restProps}
        />
      );
    case "json":
      return <JsonEditor {...controlProps} {...restProps} />;
    case "radio":
      return <Radio.Group options={opts} {...controlProps} {...restProps} />;
    case "checkboxGroup":
      return <Checkbox.Group options={opts} {...controlProps} {...restProps} />;
    case "switch":
      return <Switch {...controlProps} {...restProps} />;
    case "segmented":
      return (
        <Segmented options={opts as any} {...controlProps} {...restProps} />
      );
    case "custom": {
      const CustomComponent = customSetters[componentName as string];
      if (CustomComponent) {
        // ✔️ 修正：将 restProps (value, onChange) 和 customSetterProps (静态配置) 合并传递
        return <CustomComponent {...restProps} {...customSetterProps} />;
      }
      return <Input {...controlProps} {...restProps} allowClear />;
    }
    default:
      return <Input {...controlProps} {...restProps} />;
  }
}
