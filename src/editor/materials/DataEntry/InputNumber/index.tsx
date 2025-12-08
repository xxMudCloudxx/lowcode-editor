/**
 * @file InputNumber/index.tsx
 * @description 纯净的 InputNumber 物料组件
 */
import { forwardRef } from "react";
import {
  InputNumber as AntdInputNumber,
  type InputNumberProps as AntdInputNumberProps,
} from "antd";

const InputNumber = forwardRef<HTMLDivElement, AntdInputNumberProps>(
  ({ style, className, children, ...restProps }, ref) => {
    return (
      <div ref={ref} style={style} className={className}>
        <AntdInputNumber {...restProps} />
      </div>
    );
  }
);

InputNumber.displayName = "InputNumber";

export default InputNumber;
