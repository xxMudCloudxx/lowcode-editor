import type { CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import { Form } from "antd";

interface FrontSetterProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const FrontSetter = (props: FrontSetterProps) => {
  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
    ></Form>
  );
};

export default FrontSetter;
