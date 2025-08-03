import { useEffect, useMemo } from "react";
import { useComponentConfigStore } from "../../../../stores/component-config";
import {
  getComponentById,
  useComponetsStore,
} from "../../../../stores/components";
import { Form, Input, Select, TreeSelect } from "antd";

export interface ComponentMethodConfig {
  type: "componentMethod";
  config: {
    componentId: number;
    method: string;
    args?: Record<string, any>;
  };
}

export interface ComponentMethodProps {
  value?: ComponentMethodConfig["config"];
  onChange?: (config: ComponentMethodConfig) => void;
}

export function ComponentMethod(props: ComponentMethodProps) {
  const { value, onChange } = props;
  const { components } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();
  const [form] = Form.useForm();

  const selectedComponent = useMemo(() => {
    return value?.componentId
      ? getComponentById(value.componentId, components)
      : null;
  }, [value?.componentId, components]);

  const selectedMethodConfig = useMemo(() => {
    if (!selectedComponent || !value?.method) return null;
    return componentConfig[selectedComponent.name]?.methods?.find(
      (m) => m.name === value.method
    );
  }, [selectedComponent, value?.method, componentConfig]);

  useEffect(() => {
    if (value) {
      form.setFieldsValue(value);
      // 同时设置参数表单的值
      if (value.args) {
        form.setFieldsValue(value.args);
      }
    }
  }, [value, form]);

  const handleValuesChange = (_: any, allValues: any) => {
    const { componentId, method, ...args } = allValues;
    onChange?.({
      type: "componentMethod",
      config: {
        componentId,
        method,
        args, // 将参数打包
      },
    });
  };

  return (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      layout="vertical"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      className="mt-4 "
    >
      <Form.Item name="componentId" label="组件">
        <TreeSelect
          treeData={components}
          fieldNames={{ label: "desc", value: "id" }}
          showSearch
          treeNodeFilterProp="desc"
        />
      </Form.Item>

      {selectedComponent && (
        <Form.Item name="method" label="方法">
          <Select
            options={componentConfig[selectedComponent.name]?.methods?.map(
              (method) => ({
                label: method.label,
                value: method.name,
              })
            )}
          />
        </Form.Item>
      )}

      {/* 动态渲染参数输入框 */}
      {selectedMethodConfig?.params?.map((param: any) => (
        <Form.Item key={param.name} name={param.name} label={param.label}>
          {/* 这里可以根据 param.type 渲染不同控件，暂时只实现 input */}
          <Input />
        </Form.Item>
      ))}
    </Form>
  );
}
