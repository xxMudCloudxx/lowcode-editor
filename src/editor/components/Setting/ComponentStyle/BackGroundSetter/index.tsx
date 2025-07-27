/**
 * @file /src/editor/components/Setting/ComponentStyle/BackGroundSetter/index.tsx
 * @description
 * “样式”设置面板中的“背景”设置器。
 * 提供了用于修改组件背景颜色和透明度的 UI 控件。
 * @module Components/Setting/ComponentStyle/BackGroundSetter
 */
import { Divider, Form } from "antd";
import FormItem from "antd/es/form/FormItem";
import StyleColorPicker from "../../../common/StyleColorPicker";
import type { Component } from "../../../../stores/components";
import type { CSSProperties } from "react";
import StyleSliderWithInput from "../../../common/StyleSliderWithInput";
import { useStyleChangeHandler } from "../../../../hooks/useStyleChangeHandler";

interface BackGroundSetterProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const BackGroundSetter = (props: BackGroundSetterProps) => {
  const { curComponent, onChange } = props;
  const value = curComponent.styles;
  const createChangeHandler = useStyleChangeHandler(onChange);
  return (
    <div>
      <Divider orientation="left">背景</Divider>
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        labelAlign="right"
        style={{ width: "100%" }}
      >
        <FormItem label="颜色">
          <StyleColorPicker
            value={value?.backgroundColor}
            onChange={createChangeHandler("backgroundColor")}
          />
        </FormItem>
        <FormItem label="透明">
          <StyleSliderWithInput
            propertyName="opacity"
            value={value}
            onChange={onChange}
            min={0}
            max={1}
            step={0.01}
          />
        </FormItem>
      </Form>
    </div>
  );
};

export default BackGroundSetter;
