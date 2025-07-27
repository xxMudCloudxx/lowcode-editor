/**
 * @file /src/editor/components/common/StyleColorPicker/index.tsx
 * @description
 * 一个封装了 Ant Design ColorPicker 的受控组件，专门用于编辑 CSS 颜色属性。
 * 它处理了内部状态与外部 props 的同步，并使用 debounce 优化了 onChange 回调。
 * @module Components/Common/StyleColorPicker
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ColorPicker } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";
import { debounce } from "lodash-es";

interface StyleColorPickerProps {
  /** 外部传入的完整样式对象 */
  value?: CSSProperties;
  /** 样式更新时的回调函数 */
  onChange?: (css: CSSProperties) => void;
  /** 当前组件要绑定的 CSS 属性名，如 'color', 'backgroundColor' */
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
