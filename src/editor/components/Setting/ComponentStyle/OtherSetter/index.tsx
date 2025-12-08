/**
 * @file /src/editor/components/Setting/ComponentStyle/OtherSetter/index.tsx
 * @description
 * “样式”设置面板中的“其他”设置器。
 * 这是一个动态渲染的表单，它会根据当前选中组件 `meta.tsx` 中定义的 `styleSetter` 配置，
 * 自动生成对应的样式编辑控件。这为物料组件提供了高度的样式扩展性。
 * @module Components/Setting/ComponentStyle/OtherSetter
 */
import {
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  type FormInstance,
} from "antd";
import type { CSSProperties } from "react";
import type { Component } from "../../../../interface";
import type {
  ComponentConfig,
  ComponentSetter,
} from "../../../../stores/component-config";

// 定义 props 类型，让它能接收任意额外属性
interface FormElementProps {
  setting: ComponentSetter;
  // [key: string]: any; // 一种简单的允许任意属性的方式
}

// 使用 { setting, ...restProps } 来接收所有 props
// setting 是我们自己要用的，restProps 是一个包含了所有其他 props 的对象（如 value, onChange 等）
const FormElement = ({ setting, ...restProps }: FormElementProps) => {
  const { type, options } = setting;

  if (type === "select") {
    // 将 value, onChange 等所有未知属性展开传递给 Select
    // 规范化 options：将 string[] 转换为 { label, value }[] 格式
    const normalizedOptions = options?.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt } : opt
    );
    return <Select options={normalizedOptions} {...restProps} />;
  } else if (type === "input") {
    return <Input {...restProps} />;
  } else if (type === "inputNumber") {
    return <InputNumber {...restProps} />;
  }
  return null;
};

interface OtherSetterProps {
  form: FormInstance;
  onChange: (css: CSSProperties) => void;
  curComponent: Component;
  componentConfig: {
    [key: string]: ComponentConfig;
  };
}

const OtherSetter = (props: OtherSetterProps) => {
  const { form, onChange, curComponent, componentConfig } = props;
  const config = componentConfig[curComponent.name];
  if (!config.styleSetter) {
    return;
  }

  if (config.styleSetter.length === 0) {
    return;
  }
  return (
    <div className="mt-2">
      <Divider orientation="left">其他</Divider>
      <Form
        form={form}
        onValuesChange={onChange}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 14 }}
      >
        {componentConfig[curComponent.name]?.styleSetter?.map((setter) => (
          <Form.Item
            key={
              Array.isArray(setter.name) ? setter.name.join(".") : setter.name
            }
            name={setter.name}
            label={setter.label}
          >
            <FormElement setting={setter} />
          </Form.Item>
        ))}
      </Form>
    </div>
  );
};

export default OtherSetter;
