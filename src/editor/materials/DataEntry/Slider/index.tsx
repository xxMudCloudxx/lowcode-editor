/**
 * @file Slider/index.tsx
 * @description 纯净的 Slider 物料组件
 */
import { forwardRef } from "react";
import { Slider as AntdSlider } from "antd";
import type { MaterialProps } from "../../interface";

const Slider = forwardRef<HTMLDivElement, MaterialProps>(
  ({ style, className, "data-component-id": id, ...restProps }, ref) => {
    return (
      <div
        ref={ref}
        data-component-id={id}
        // Slider 需要宽度才能显示，且为了防止把 padding 传给 Antd 导致样式怪异，Wrapper 控制布局
        style={{ minWidth: 100, ...style }}
        className={className}
      >
        <AntdSlider {...restProps} />
      </div>
    );
  }
);

Slider.displayName = "Slider";
export default Slider;
