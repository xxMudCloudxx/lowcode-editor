/**
 * @file Slider/index.tsx
 * @description 纯净的 Slider 物料组件
 */
import { forwardRef } from "react";
import { Slider as AntdSlider, type SliderSingleProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface SliderProps extends MaterialProps, SliderSingleProps {}

const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      style,
      className,
      "data-component-id": id,
      children,
      min,
      max,
      step,
      defaultValue,
      ...restProps
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-component-id={id}
        // Slider 需要宽度才能显示
        style={{ minWidth: 100, ...style }}
        className={className}
      >
        <AntdSlider
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue}
          {...restProps}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";
export default Slider;
