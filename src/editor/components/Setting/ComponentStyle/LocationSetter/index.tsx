/**
 * @file /src/editor/components/Setting/ComponentStyle/LocationSetter/index.tsx
 * @description
 * “样式”设置面板中的“位置”设置器。
 * 提供了用于修改组件定位（position）、层级（z-index）、浮动（float）和清除浮动（clear）的 UI 控件。
 * @module Components/Setting/ComponentStyle/LocationSetter
 */
import { Divider, Form, InputNumber, Select, type SelectProps } from "antd";
import type { Component } from "../../../../stores/components";
import { useEffect, useState, type CSSProperties } from "react";
import LocationBoxModalEditor from "./BoxModalEditor";
import { cap } from "../../../../utils/styles";
import { useStyleChangeHandler } from "../../../../hooks/useStyleChangeHandler";
import StyleOptionGroup from "../../../common/StyleOptionGroup";
import { LocationOptions } from "./config";

interface LocationSetterProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const POSITION_VALUES = [
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
] as const;
type Position = (typeof POSITION_VALUES)[number];

const POSITION_OPTIONS: SelectProps<Position>["options"] = POSITION_VALUES.map(
  (p) => ({
    label: cap(p),
    value: p,
  })
);

const LocationSetter = ({ curComponent, onChange }: LocationSetterProps) => {
  const value = curComponent.styles ?? {};

  const [position, setPosition] = useState<Position | undefined>(
    value.position as Position | undefined
  );

  useEffect(() => {
    if (value.position !== position) {
      setPosition(value.position as Position | undefined);
    }
  }, [value.position]); // 只关心这一字段

  const createChangeHandler = useStyleChangeHandler(onChange);

  const handlePositionChange = (pos: Position | undefined) => {
    setPosition(pos);
    createChangeHandler("position")(pos);
  };

  return (
    <div>
      <Divider orientation="left">位置</Divider>

      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} labelAlign="right">
        <Form.Item label="定位">
          <Select
            options={POSITION_OPTIONS}
            value={position}
            onChange={handlePositionChange}
            allowClear
          />
          {position !== "static" && position && (
            <LocationBoxModalEditor value={value} onChange={onChange} />
          )}
        </Form.Item>
        <Form.Item label="zIndex">
          <InputNumber
            value={value.zIndex}
            onChange={createChangeHandler("zIndex")}
            style={{ width: "100%" }}
            placeholder=""
          />
        </Form.Item>
        <StyleOptionGroup
          label="浮动"
          options={LocationOptions.float}
          currentValue={value.float}
          onChange={createChangeHandler("float")}
        />
        <StyleOptionGroup
          label="清除"
          options={LocationOptions.clear}
          currentValue={value.clear}
          onChange={createChangeHandler("clear")}
        />
      </Form>
    </div>
  );
};

export default LocationSetter;
