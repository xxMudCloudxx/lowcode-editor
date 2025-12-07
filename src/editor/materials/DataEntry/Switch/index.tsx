/**
 * @file Switch/index.tsx
 * @description 纯净的 Switch 物料组件
 */
import { forwardRef } from "react";
import { Switch as AntdSwitch } from "antd";
import type { MaterialProps } from "../../interface";

const Switch = forwardRef<HTMLDivElement, MaterialProps>(
  ({ style, className, "data-component-id": id, ...restProps }, ref) => {
    return (
      <div
        ref={ref}
        data-component-id={id}
        // 保持 Switch 的紧凑行内特性
        style={{ display: "inline-block", ...style }}
        className={className}
      >
        <AntdSwitch {...restProps} />
      </div>
    );
  }
);

Switch.displayName = "Switch";
export default Switch;
