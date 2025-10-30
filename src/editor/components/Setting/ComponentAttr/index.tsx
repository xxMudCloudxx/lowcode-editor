// src/editor/components/Setting/ComponentAttr/index.tsx

import { Form, Input } from "antd";
import { useComponetsStore } from "../../../stores/components";
import { useMemo } from "react";
import { useComponentConfigStore } from "../../../stores/component-config";
import { getValuePropNameFor } from "../../../utils/formUtils";
import { FormElementRenderer } from "./FormElementRenderer";
import { useComponentAttrForm } from "../../../hooks/useComponentAttrForm";
import FormItem from "antd/es/form/FormItem";

export function ComponentAttr() {
  const { curComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // 调用 Hook，获取表单实例和事件处理器
  const { form, handleValuesChange } = useComponentAttrForm(curComponent);

  const meta = useMemo(
    () => (curComponent ? componentConfig[curComponent.name] : null),
    [curComponent, componentConfig]
  );

  if (!curComponent || !meta) return null;

  return (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      className="overflow-y-auto h-[100%] w-[90%] absolute overscroll-y-contain pb-90"
    >
      {/* 固定的只读信息 */}
      <FormItem label="组件id">
        <Input value={curComponent.id} disabled />
      </FormItem>
      <FormItem label="组件描述">
        <Input value={curComponent.desc} disabled />
      </FormItem>

      {/* 根据组件“蓝图”中的 setter 配置，动态生成表单项 */}
      {meta.setter?.map((setter) => {
        const valuePropName = getValuePropNameFor(setter.type);
        return (
          <FormItem
            key={setter.name}
            name={setter.name}
            label={setter.label}
            valuePropName={valuePropName}
          >
            {/* 5. 调用独立的渲染器组件 */}
            <FormElementRenderer setting={setter} />
          </FormItem>
        );
      })}
    </Form>
  );
}
