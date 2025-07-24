import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ColorPicker } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";
import { debounce } from "lodash-es";

interface StyleColorPickerProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
  propertyName: keyof CSSProperties;
}

const StyleColorPicker = ({
  value = {},
  onChange,
  propertyName,
}: StyleColorPickerProps) => {
  const [internalColor, setInternalColor] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    setInternalColor(value[propertyName] as string);
  }, [value]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((hex: string) => {
        onChange?.({ [propertyName]: hex });
      }, 200),
    [onChange]
  );

  const handleChange = (color: AggregationColor) => {
    const hex = color.toHexString();
    setInternalColor(hex);
    debouncedOnChange(hex);
  };

  const handleClear = () => {
    setInternalColor("");
    debouncedOnChange("");
  };

  return (
    <ColorPicker
      style={{ width: "100%" }}
      value={internalColor}
      onChange={handleChange}
      onClear={handleClear}
      showText
      allowClear
    />
  );
};

export default StyleColorPicker;
