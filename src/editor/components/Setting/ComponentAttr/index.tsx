/**
 * @file /src/editor/components/Setting/ComponentAttr/index.tsx
 * @description
 * “属性”设置面板。
 * 负责根据选中组件的 `setter` 配置，动态生成一个表单，
 * 用于修改该组件的 props。
 * @module Components/Setting/ComponentAttr
 */

import { Form, Input, Select } from "antd";
import { useComponetsStore } from "../../../stores/components";
import { useEffect } from "react";
import {
  useComponentConfigStore,
  type ComponentConfig,
  type ComponentSetter,
} from "../../../stores/component-config";

export function ComponentAttr() {
  const [form] = Form.useForm();

  const { curComponentId, curComponent, updateComponentProps } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  useEffect(() => {
    const data = form.getFieldsValue();
    form.setFieldsValue({ ...data, ...curComponent?.props });
  }, [curComponent]);

  if (!curComponentId || !curComponent) return null;

  /**
   * @description 根据 setter 配置动态渲染不同的 antd 表单组件。
   */
  function renderFormElememt(setting: ComponentSetter) {
    const { type, options } = setting;

    if (type === "select") {
      return <Select options={options} />;
    } else if (type === "input") {
      return <Input />;
    }
  }

  /**
   * @description 表单值变化时的回调函数。
   * 直接调用 store 的 action 来更新组件的 props，实现了 UI 到状态的单向数据流。
   */
  function valueChange(changeValues: ComponentConfig) {
    if (curComponentId) {
      updateComponentProps(curComponentId, changeValues);
    }
  }

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
    >
      {/* 固定的只读信息 */}
      <Form.Item label="组件id">
        <Input value={curComponent.id} disabled />
      </Form.Item>
      <Form.Item label="组件名称">
        <Input value={curComponent.name} disabled />
      </Form.Item>
      <Form.Item label="组件描述">
        <Input value={curComponent.desc} disabled />
      </Form.Item>

      {/* 根据组件“蓝图”中的 setter 配置，动态生成表单项 */}
      {componentConfig[curComponent.name]?.setter?.map((setter) => (
        <Form.Item key={setter.name} name={setter.name} label={setter.label}>
          {renderFormElememt(setter)}
        </Form.Item>
      ))}
    </Form>
  );
}
