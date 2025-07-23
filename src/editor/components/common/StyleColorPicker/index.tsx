import type { CSSProperties } from "react";
import { ColorPicker } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";

interface StyleColorPickerProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const StyleColorPicker = ({ value = {}, onChange }: StyleColorPickerProps) => {
  const propertyName = "color";
  const handleChange = (color: AggregationColor) => {
    onChange?.({ [propertyName]: color.toHexString() });
  };

  const handleClear = () => {
    onChange?.({ [propertyName]: "" });
  };

  return (
    <ColorPicker
      style={{ width: "100%" }}
      value={value[propertyName] as string}
      onChange={handleChange}
      onClear={handleClear}
      showText
      allowClear
    />
  );
};

export default StyleColorPicker;
