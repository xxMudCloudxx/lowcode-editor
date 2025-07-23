import { useCallback, type CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import { ColorPicker, Form, InputNumber, Slider, Space } from "antd";
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
  const opacityValue = typeof value?.opacity === "number" ? value.opacity : 0;
  const createChangeHandler = useCallback(
    (key: any) => {
      console.log(key);
      return (newValue?: any) => {
        onChange?.({ [key]: newValue });
      };
    },
    [onChange]
  );

  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      labelAlign="right"
      style={{ width: "100%" }}
    >
      <FormItem wrapperCol={{ span: 24 }}>
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
      <div className="mr-9">
        <FormItem label="字重">
          <StyleSelectEditor
            label="字重"
            propertyName="fontWeight"
            options={fontWeightOptions}
            value={value}
            onChange={onChange}
          />
        </FormItem>
        <FormItem label="颜色">
          <ColorPicker
            style={{ width: "100%" }}
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
        <FormItem label="布局">
          <StyleOptionGroup
            options={textAlignOptions.align}
            currentValue={align}
            onChange={createChangeHandler("textAlign")}
          />
        </FormItem>
        <FormItem label="透明">
          <div className="flex flex-row">
            <Slider
              className="flex-3"
              min={0}
              max={1}
              step={0.01}
              onChange={createChangeHandler("opacity")}
              value={opacityValue}
            />
            <div className="size-3" />
            <InputNumber
              className="flex-1"
              min={0}
              max={1}
              value={opacityValue}
              onChange={createChangeHandler("opacity")}
            />
          </div>
        </FormItem>
      </div>
    </Form>
  );
};

export default FrontSetter;
