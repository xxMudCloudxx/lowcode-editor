// src/editor/components/Setting/ComponentAttr/index.tsx
/**
 * 组件属性设置面板
 *
 * 布局特点：
 * - 所有项目采用水平表格式布局（标签左 + 控件右）
 * - 标签列固定宽度(80px)，控件列填满剩余空间，保证对齐
 * - 紧凑间距，高信息密度
 */

import { Form, Input } from "antd";
import { useMemo } from "react";
import {
  useComponentsStore,
  getComponentById,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import type { Component } from "@lowcode/schema";
import { useComponentConfigStore } from "../../../stores/component-config";
import { getValuePropNameFor } from "../../../utils/formUtils";
import { FormElementRenderer } from "./FormElementRenderer";
import { useComponentAttrForm } from "../../../hooks/useComponentAttrForm";
import FormItem from "antd/es/form/FormItem";

export function ComponentAttr() {
  const { components, updateComponentDesc } = useComponentsStore();
  const curComponentId = useUIStore((s) => s.curComponentId);
  const { componentConfig } = useComponentConfigStore();

  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components],
  );

  const { form, handleValuesChange } = useComponentAttrForm(curComponent);

  const meta = useMemo(
    () => (curComponent ? componentConfig[curComponent.name] : null),
    [curComponent, componentConfig],
  );

  if (!curComponent || !meta) return null;

  return (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      size="small"
      className="h-full w-full pb-24 overflow-y-auto custom-scrollbar"
    >
      {/* 基本信息分组 */}
      <div className="px-3 py-2 bg-neutral-50 text-neutral-500 text-xs font-medium border-b border-neutral-100">
        基本
      </div>

      <div className="px-3 py-2">
        {/* 组件 ID */}
        <div className="flex items-center min-h-8 mb-1">
          <span className="text-neutral-500 text-sm shrink-0 w-20">组件ID</span>
          <div className="flex-1 min-w-0">
            <Input
              value={curComponent.id}
              disabled
              variant="borderless"
              className="text-neutral-400"
            />
          </div>
        </div>

        {/* 组件名 */}
        <div className="flex items-center min-h-8 mb-1">
          <span className="text-neutral-600 text-sm shrink-0 w-20">组件名</span>
          <div className="flex-1 min-w-0">
            <Input
              value={curComponent.name}
              disabled
              variant="borderless"
              className="text-neutral-600"
            />
          </div>
        </div>

        {/* 组件描述 - 可编辑，会更新大纲树节点名称 */}
        <div className="flex items-center min-h-8 mb-1">
          <span className="text-neutral-600 text-sm shrink-0 w-20">
            组件描述
          </span>
          <div className="flex-1 min-w-0">
            <Input
              value={curComponent.desc}
              className="text-neutral-600"
              onChange={(e) => {
                if (curComponentId != null) {
                  updateComponentDesc(curComponentId, e.target.value);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 属性设置分组 */}
      <div className="px-3 py-2 bg-neutral-50 text-neutral-500 text-xs font-medium border-y border-neutral-100">
        属性
      </div>

      <div className="px-3 py-2">
        {meta.setter?.map((setter) => {
          const valuePropName = getValuePropNameFor(setter.type);
          const itemKey = Array.isArray(setter.name)
            ? setter.name.join(".")
            : setter.name;

          return (
            <div key={itemKey} className="flex items-start min-h-8 mb-2">
              {/* 标签列 - 固定宽度保证对齐 */}
              <span className="text-neutral-600 text-sm shrink-0 w-20 leading-8">
                {setter.label}
              </span>

              {/* 控件列 */}
              <div className="flex-1 min-w-0">
                <FormItem
                  name={setter.name}
                  valuePropName={valuePropName}
                  className="mb-0"
                  style={{ marginBottom: 0 }}
                >
                  <FormElementRenderer setting={setter} />
                </FormItem>
              </div>
            </div>
          );
        })}
      </div>
    </Form>
  );
}
