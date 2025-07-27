import { Divider, Form } from "antd";
import type { Component } from "../../../../stores/components";
import { type CSSProperties } from "react";
import BorderRadiusEditor from "./BorderRadiusEditor";
import type { KebabCaseCSSProperties } from "../../../../utils/styles";
import BorderEditor from "./BorderEditor";
import ShadowSetter from "./ShadowSetter";

interface BoardSetterProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const BoardSetter = (props: BoardSetterProps) => {
  const { curComponent, onChange } = props;
  const value = curComponent.styles;

  return (
    <div>
      <Divider orientation="left">边框</Divider>
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} labelAlign="right">
        <BorderRadiusEditor
          value={value as KebabCaseCSSProperties}
          onChange={onChange}
          id={curComponent.id}
        />
        <Form.Item label="边框">
          <BorderEditor
            value={value as KebabCaseCSSProperties}
            onChange={onChange}
          />
        </Form.Item>
        <Form.Item label="阴影">
          <ShadowSetter value={value} onChange={onChange} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BoardSetter;
