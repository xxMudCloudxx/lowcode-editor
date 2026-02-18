/**
 * @file Steps/index.tsx
 * @description 纯净的步骤条组件
 */
import { forwardRef } from "react";
import { Steps as AntdSteps, type StepsProps as AntdStepsProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface StepsProps
  extends MaterialProps,
    Omit<AntdStepsProps, keyof MaterialProps> {}

const Steps = forwardRef<HTMLDivElement, StepsProps>(
  (
    {
      style,
      className,
      items,
      current,
      direction,
      size,
      "data-component-id": id,
      children,
      ...restProps
    },
    ref
  ) => {
    return (
      <div ref={ref} data-component-id={id} style={style} className={className}>
        <AntdSteps
          items={items}
          current={current}
          direction={direction}
          size={size}
          {...restProps}
        />
      </div>
    );
  }
);

Steps.displayName = "Steps";

export default Steps;
