import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ColorPicker } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";
import { debounce } from "lodash-es";

interface StyleColorPickerProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
  propertyName: keyof CSSProperties;
  className?: string;
}

const StyleColorPicker = ({
  value = {},
  onChange,
  propertyName,
  className = "",
}: StyleColorPickerProps) => {
  const [internalColor, setInternalColor] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    console.log(propertyName);
    setInternalColor(value[propertyName] as string);
  }, [value[propertyName], propertyName]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((hex: string | undefined) => {
        onChange?.({ [propertyName]: hex });
      }, 200),
    [onChange]
  );

  const handleChange = (color: AggregationColor) => {
    const hex = color.toHexString() === "" ? undefined : color.toHexString();
    setInternalColor(hex);
    debouncedOnChange(hex);
  };

  const handleClear = () => {
    setInternalColor(undefined);
    debouncedOnChange(undefined);
  };

  return (
    <ColorPicker
      style={{ width: "100%" }}
      value={internalColor}
      onChangeComplete={handleChange}
      onClear={handleClear}
      showText
      allowClear
      className={className}
    />
  );
};

export default StyleColorPicker;
