/**
 * @file Select/index.tsx
 * @description 纯净的 Select 物料组件
 */
import { forwardRef } from "react";
import { Select as AntdSelect } from "antd";
import type { MaterialProps } from "../../interface";

const Select = forwardRef<HTMLDivElement, MaterialProps>(
  ({ style, className, "data-component-id": id, ...restProps }, ref) => {
    return (
      <div ref={ref} data-component-id={id} style={style} className={className}>
        <AntdSelect
          style={{ width: "100%" }} // 内部组件占满 Wrapper
          {...restProps}
        />
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
