/**
 * @file /src/editor/components/common/StyleSliderWithInput/index.tsx
 * @description
 * 一个组合了滑块（Slider）和数字输入框（InputNumber）的复合受控组件。
 * 用于精确地编辑数值型的 CSS 属性（如 opacity, borderRadius）。
 * 组件内部处理了单位的添加与移除，并对 onChange 事件进行了优化。
 * @module Components/Common/StyleSliderWithInput
 */
import { InputNumber, Slider } from "antd";
import { useState, type CSSProperties } from "react";
import { addUnit, stripUnit } from "../../../utils/styles";

interface StyleSliderWithInputProps {
  /** 当前组件要绑定的 CSS 属性名，如 'opacity', 'borderRadius' */
  propertyName: keyof CSSProperties;
  /** 外部传入的完整样式对象 */
  value?: CSSProperties;
  /** 样式更新时的回调函数 */
  onChange?: (css: CSSProperties) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: string | number;
}

const StyleSliderWithInput = ({
  propertyName,
  value = {},
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  defaultValue,
}: StyleSliderWithInputProps) => {
  // 明确优先级：props.value > props.defaultValue > fallback("")
  const getInitialValue = () => {
    const propValue = value[propertyName];
    // 如果 props.value 存在，则它具有最高优先级
    if (propValue !== undefined && propValue !== null) {
      return stripUnit(unit || "", propValue);
    }
    // 如果 props.value 不存在，再考虑使用 defaultValue
    if (defaultValue !== undefined) {
      return String(defaultValue);
    }
    // 如果两者都不存在，则返回空字符串
    return "";
  };

  const [internalValue, setInternalValue] = useState(getInitialValue());

  // 当外部 props.value 变化时，同步到内部状态（render-time sync）
  const propValue = value[propertyName];
  const [prevPropValue, setPrevPropValue] = useState(propValue);
  if (propValue !== prevPropValue) {
    setPrevPropValue(propValue);
    const externalValue = stripUnit(unit || "", propValue);
    if (
      externalValue !== undefined &&
      externalValue !== null &&
      externalValue !== ""
    ) {
      setInternalValue(externalValue);
    } else if (defaultValue === undefined) {
      setInternalValue("");
    }
  }

  // 将内部状态值转换为数字，用于组件渲染
  const numericValue = parseFloat(internalValue.toString());

  // 定义一个处理最终变更的函数
  const handleFinalChange = (finalNumericValue: number) => {
    // 如果没有 onChange prop，则直接返回
    if (!onChange) {
      return;
    }

    // 检查 finalNumericValue 是否为一个有效的数字
    if (!isNaN(finalNumericValue)) {
      // ---- 情况一：用户输入了有效数字 ----
      // 格式化并向上通知父组件
      const newStringValue = String(finalNumericValue);
      const finalValue = unit ? addUnit(unit, newStringValue) : newStringValue;
      onChange({ [propertyName]: finalValue });
    } else {
      // ---- 情况二：用户清空了输入框，导致 finalNumericValue 为 NaN ----
      // 我们将此行为解读为“删除该CSS属性”
      // 向上通知父组件将该属性值设为 undefined
      onChange({ [propertyName]: undefined });
    }
  };

  return (
    <div className="flex flex-row items-center">
      <Slider
        className="flex-auto"
        min={min}
        max={max}
        step={step}
        onChange={(val) => setInternalValue(String(val))}
        onChangeComplete={handleFinalChange}
        value={isNaN(numericValue) ? 0 : numericValue}
      />
      <div className="size-3" />
      <InputNumber
        className="ml-4 flex-none"
        style={{ width: 70 }}
        min={min}
        max={max}
        step={step}
        onChange={(val) => setInternalValue(String(val ?? ""))}
        onPressEnter={() => handleFinalChange(numericValue)}
        onBlur={() => handleFinalChange(numericValue)}
        value={isNaN(numericValue) ? null : numericValue}
      />
    </div>
  );
};

export default StyleSliderWithInput;
