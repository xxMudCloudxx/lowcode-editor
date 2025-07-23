import type { CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import { ColorPicker, Form } from "antd";
import FormItem from "antd/es/form/FormItem";
import PairedInputEditor from "../../../common/PariedInputEditor";
import { fontWeightOptions, textAlignOptions } from "./config";
import StyleSelectEditor from "../../../common/StyleSelectEditor";
import { AggregationColor } from "antd/es/color-picker/color";
import StyleOptionGroup from "../../../common/StyleOptionGroup";

interface FrontSetterProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const FrontSetter = (props: FrontSetterProps) => {
  const { curComponent, onChange } = props;
  const value = curComponent.styles;
  const align = value?.textAlign;
  const createChangeHandler = (key: any) => {
    console.log(key);
    return (newValue?: string) => {
      onChange?.({ [key]: newValue });
    };
  };

  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      labelAlign="right"
      // className="flex justify-center items-center"
      layout="horizontal"
    >
      <FormItem>
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
        />
      </FormItem>
      <FormItem>
        <StyleSelectEditor
          label="字重"
          propertyName="fontWeight"
          options={fontWeightOptions}
          value={value}
          onChange={onChange}
        />
      </FormItem>
      <FormItem>
        <ColorPicker
          onChange={(value: AggregationColor) => {
            onChange?.({
              ["color"]: value.toHexString(),
            });
          }}
          showText
          allowClear
          onClear={() => {
            onChange?.({
              ["color"]: "",
            });
          }}
        />
      </FormItem>
      <FormItem>
        <StyleOptionGroup
          label="布局模式"
          options={textAlignOptions.align}
          currentValue={align}
          onChange={createChangeHandler("textAlign")}
        />
      </FormItem>
    </Form>
  );
};

export default FrontSetter;
