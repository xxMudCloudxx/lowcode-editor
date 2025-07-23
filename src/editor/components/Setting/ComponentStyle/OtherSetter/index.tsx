import {
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  type FormInstance,
} from "antd";
import type { CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
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
    return <Select options={options} {...restProps} />;
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
          <Form.Item key={setter.name} name={setter.name} label={setter.label}>
            <FormElement setting={setter} />
          </Form.Item>
        ))}
      </Form>
    </div>
  );
};

export default OtherSetter;
