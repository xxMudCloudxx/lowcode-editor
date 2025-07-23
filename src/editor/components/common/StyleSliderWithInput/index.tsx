import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { InputNumber, Slider } from "antd";
import { debounce } from "lodash-es";

interface StyleSliderWithInputProps {
  propertyName: keyof CSSProperties;
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
  min?: number;
  max?: number;
  step?: number;
}

const StyleSliderWithInput = ({
  propertyName,
  value = {},
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: StyleSliderWithInputProps) => {
  // 创建内部状态，用于即时 UI 反馈
  const [internalValue, setInternalValue] = useState(0);

  // 当来自全局状态的 prop 变化时，同步到内部状态
  useEffect(() => {
    const propValue = value[propertyName];
    const numericValue = typeof propValue === "number" ? propValue : 1;
    setInternalValue(numericValue);
  }, [value, propertyName]);

  // 创建一个防抖的回调函数，用于“延迟”通知父组件
  const debouncedOnChange = useMemo(
    () =>
      debounce((newValue: number | null) => {
        onChange?.({ [propertyName]: newValue });
      }, 100), // 100毫秒的延迟
    [onChange, propertyName]
  );

  //  handleChange 现在会立即更新内部状态，并触发防抖回调
  const handleChange = (newValue: number | null) => {
    const numericValue = newValue ?? 1;
    setInternalValue(numericValue); // 立即更新UI
    debouncedOnChange(numericValue); // 延迟更新全局State
  };

  return (
    <div className="flex flex-row items-center">
      <Slider
        className="flex-auto"
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        value={internalValue}
      />
      <div className="size-3" />
      <InputNumber
        className="ml-4 flex-none"
        style={{ width: 70 }}
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={handleChange}
      />
    </div>
  );
};

export default StyleSliderWithInput;
