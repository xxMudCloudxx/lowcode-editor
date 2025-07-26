import type { CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import BoxModelEditor from "./BoxModelEditor";
import LayoutModal from "./LayoutModal";
import SizeEditor from "./SizeEditor";
import { Divider, Form } from "antd";

interface LayoutProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const LayoutSetter = (props: LayoutProps) => {
  const { curComponent, onChange } = props;

  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      labelAlign="right"
      style={{ width: "100%" }}
    >
      <Divider orientation="left">布局</Divider>
      <LayoutModal value={curComponent.styles} onChange={onChange} />
      <Form.Item label="边距">
        <BoxModelEditor value={curComponent.styles} onChange={onChange} />
      </Form.Item>
      <Form.Item label="大小">
        <SizeEditor
          value={curComponent.styles}
          onChange={onChange}
          curComponentId={curComponent.id}
        />
      </Form.Item>
    </Form>
  );
};

export default LayoutSetter;
