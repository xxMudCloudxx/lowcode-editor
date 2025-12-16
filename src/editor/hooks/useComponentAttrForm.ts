// src/editor/hooks/useComponentAttrForm.ts
import { useEffect } from "react";
import { Form } from "antd";
import { useComponentsStore } from "../stores/components";
import { useUIStore } from "../stores/uiStore";
import type { Component } from "../interface";

type AnyObject = Record<string, any>;

/**
 * 管理属性面板表单逻辑的 Hook
 * @param curComponent 当前选中的组件
 */
export function useComponentAttrForm(curComponent: Component | null) {
  const [form] = Form.useForm<AnyObject>();
  const { updateComponentProps } = useComponentsStore();
  const curComponentId = useUIStore((s) => s.curComponentId);

  // Effect: 当选中组件变化时，同步 antd Form 的值
  useEffect(() => {
    if (!curComponent) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(curComponent.props);
  }, [curComponentId, curComponent?.props, form]); // 依赖 curComponent.props 确保外部撤销/重做也能同步

  // 表单值变化时的回调函数（只传递实际变动的字段，生成最小化 patch）
  const handleValuesChange = (changedValues: AnyObject) => {
    if (curComponentId) {
      // changedValues 只包含本次变动的字段，直接合并即可
      updateComponentProps(curComponentId, changedValues, false);
    }
  };

  return { form, handleValuesChange };
}
