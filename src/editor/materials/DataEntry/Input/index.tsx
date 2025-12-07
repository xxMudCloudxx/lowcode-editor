/**
 * @file Input/index.tsx
 * @description 纯净的 Input 物料组件
 */
import { forwardRef } from "react";
import { Input as AntdInput } from "antd";
import type { MaterialProps } from "../../interface";

const Input = forwardRef<HTMLDivElement, MaterialProps>(
  (
    { style, className, "data-component-id": id, children, ...restProps },
    ref
  ) => {
    return (
      <div ref={ref} data-component-id={id} style={style} className={className}>
        <AntdInput {...restProps} />
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
