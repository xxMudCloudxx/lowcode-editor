/**
 * @file Radio/index.tsx
 * @description 纯净的 Radio 物料组件
 */
import { forwardRef } from "react";
import { Radio as AntdRadio } from "antd";
import type { MaterialProps } from "../../interface";

const Radio = forwardRef<HTMLDivElement, MaterialProps>(
  ({ style, className, "data-component-id": id, ...restProps }, ref) => {
    return (
      <div ref={ref} data-component-id={id} style={style} className={className}>
        <AntdRadio.Group {...restProps} />
      </div>
    );
  }
);

Radio.displayName = "Radio";
export default Radio;
