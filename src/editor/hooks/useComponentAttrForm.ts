// src/editor/hooks/useComponentAttrForm.ts
import { useEffect } from "react";
import { Form } from "antd";
import { useComponetsStore } from "../stores/components";
import type { Component } from "../stores/components";

type AnyObject = Record<string, any>;

/**
 * 管理属性面板表单逻辑的 Hook
 * @param curComponent 当前选中的组件
 */
export function useComponentAttrForm(curComponent: Component | null) {
  const [form] = Form.useForm<AnyObject>();
  const { curComponentId, updateComponentProps } = useComponetsStore();

  // Effect: 当选中组件变化时，同步 antd Form 的值
  useEffect(() => {
    if (!curComponent) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(curComponent.props);
  }, [curComponentId, curComponent?.props, form]); // 依赖 curComponent.props 确保外部撤销/重做也能同步

  // 表单值变化时的回调函数
  const handleValuesChange = (_: AnyObject, allValues: AnyObject) => {
    if (curComponentId) {
      const newProps = Object.fromEntries(
        Object.entries(allValues).filter(([_, value]) => value !== undefined)
      );
      // 使用替换模式，用过滤后的新 props 对象完全替换旧的
      updateComponentProps(curComponentId, newProps, true);
    }
  };

  return { form, handleValuesChange };
}
