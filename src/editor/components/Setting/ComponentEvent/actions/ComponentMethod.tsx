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
    <div className="pt-4 space-y-6">
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        layout="vertical"
        className="space-y-4"
      >
        <Form.Item 
          name="componentId" 
          label={<span className="text-sm font-medium text-gray-700">目标组件</span>}
          className="mb-4"
        >
          <TreeSelect
            className="w-full"
            size="large"
            placeholder="请选择要调用方法的组件"
            treeData={components}
            fieldNames={{ label: "desc", value: "id" }}
            showSearch
            treeNodeFilterProp="desc"
            dropdownStyle={{ maxHeight: 300 }}
          />
        </Form.Item>

        {selectedComponent && (
          <Form.Item 
            name="method" 
            label={<span className="text-sm font-medium text-gray-700">调用方法</span>}
            className="mb-4"
          >
            <Select
              className="w-full"
              size="large"
              placeholder="请选择要调用的方法"
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
          <Form.Item 
            key={param.name} 
            name={param.name} 
            label={<span className="text-sm font-medium text-gray-700">{param.label}</span>}
            className="mb-4"
          >
            <Input 
              className="w-full"
              size="large"
              placeholder={`请输入${param.label}...`}
            />
          </Form.Item>
        ))}
      </Form>
    </div>
  );
}
