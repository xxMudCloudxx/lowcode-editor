import { useCallback, type CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import { Divider, Form } from "antd";
import FormItem from "antd/es/form/FormItem";
import PairedInputEditor from "../../../common/PariedInputEditor";
import {
  fontFamilyOptions,
  fontWeightOptions,
  textAlignOptions,
} from "./config";
import StyleSelectEditor from "../../../common/StyleSelectEditor";
import StyleOptionGroup from "../../../common/StyleOptionGroup";
import StyleColorPicker from "../../../common/StyleColorPicker";
import StyleSliderWithInput from "../../../common/StyleSliderWithInput";

interface FrontSetterProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const FrontSetter = (props: FrontSetterProps) => {
  const { curComponent, onChange } = props;
  const value = curComponent.styles;
  const align = value?.textAlign;

  const createChangeHandler = useCallback(
    (key: any) => {
      return (newValue?: any) => {
        onChange?.({ [key]: newValue });
      };
    },
    [onChange]
  );

  return (
    <>
      <Divider orientation="left">文字</Divider>
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        labelAlign="right"
        style={{ width: "100%" }}
      >
        <FormItem label="字大">
          <PairedInputEditor
            value={value}
            onChange={onChange}
            unit="px"
            prop1={{
              label: "字号",
              propertyName: "fontSize",
              placeholder: `字号`,
            }}
            prop2={{
              label: "行高",
              propertyName: "lineHeight",
              placeholder: `行高`,
            }}
            unStyle={true}
          />
        </FormItem>
        <FormItem label="字重">
          <StyleSelectEditor
            label="字重"
            propertyName="fontWeight"
            options={fontWeightOptions}
            value={value}
            onChange={onChange}
          />
        </FormItem>{" "}
        <FormItem label="字体">
          <StyleSelectEditor
            label="字体"
            propertyName="fontFamily"
            options={fontFamilyOptions}
            value={value}
            onChange={onChange}
          />
        </FormItem>
        <FormItem label="颜色">
          <StyleColorPicker
            value={value}
            onChange={onChange}
            propertyName="color"
          />
        </FormItem>
        <FormItem label="布局">
          <StyleOptionGroup
            options={textAlignOptions.align}
            currentValue={align}
            onChange={createChangeHandler("textAlign")}
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
    </>
  );
};

export default FrontSetter;
