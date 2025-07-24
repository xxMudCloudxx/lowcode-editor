import { Divider, Form, Select, type SelectProps } from "antd";
import type { Component } from "../../../../stores/components";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import LocationBoxModalEditor from "./BoxModalEditor";
import { cap } from "../../../../utils/styles";

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

  const handlePositionChange = useCallback(
    (pos: Position | undefined) => {
      setPosition(pos);
      onChange?.({ position: pos });
    },
    [onChange]
  );

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
        </Form.Item>

        {position !== "static" && (
          <LocationBoxModalEditor value={value} onChange={onChange} />
        )}
      </Form>
    </div>
  );
};

export default LocationSetter;
