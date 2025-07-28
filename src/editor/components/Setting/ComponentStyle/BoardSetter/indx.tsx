/**
 * @file /src/editor/components/Setting/ComponentStyle/BoardSetter/indx.tsx
 * @description
 * “样式”设置面板中的“边框”设置器。
 * 这是一个容器组件，聚合了所有与边框、圆角和阴影相关的设置器，
 * 包括 `BorderRadiusEditor`, `BorderEditor`, 和 `ShadowSetter`。
 * @module Components/Setting/ComponentStyle/BoardSetter
 */
import { Form } from "antd";
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
