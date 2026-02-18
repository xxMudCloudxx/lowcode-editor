/**
 * @file /src/editor/components/common/StyleColorPicker/index.tsx
 * @description
 * 一个封装了 Ant Design ColorPicker 的受控组件，专门用于编辑 CSS 颜色属性。
 * @module Components/Common/StyleColorPicker
 */
import { ColorPicker } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";

interface StyleColorPickerProps {
  /** 外部传入的完整样式对象 */
  value?: string;
  /** 样式更新时的回调函数 */
  onChange: (string: string | undefined) => void;
  /** 当前组件要绑定的 CSS 属性名，如 'color', 'backgroundColor' */
  className?: string;
}

const StyleColorPicker = ({
  value = "",
  onChange,
  className = "",
}: StyleColorPickerProps) => {
  const handleChange = (color: AggregationColor) => {
    const hex = color.toHexString() === "" ? undefined : color.toHexString();
    onChange(hex);
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <ColorPicker
      style={{ width: "100%" }}
      value={value}
      onChangeComplete={handleChange}
      onClear={handleClear}
      showText
      allowClear
      className={className}
    />
  );
};

export default StyleColorPicker;
