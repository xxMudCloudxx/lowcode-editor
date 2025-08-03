import { Steps as AntdSteps } from "antd";
import type { CommonComponentProps } from "../../../interface";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

export interface StepsRef {
  next: () => void;
  prev: () => void;
}

const StepsProd: React.ForwardRefRenderFunction<
  StepsRef,
  Omit<CommonComponentProps, "ref">
> = ({ id, styles, ...props }, ref) => {
  const [current, setCurrent] = useState(props.current || 0);

  // 当外部通过属性面板修改 current prop 时，同步到内部 state
  useEffect(() => {
    setCurrent(props.current || 0);
  }, [props.current]);

  useImperativeHandle(ref, () => ({
    next: () => {
      // 确保不会超出范围
      if (current < props.items.length - 1) {
        setCurrent(current + 1);
      }
    },
    prev: () => {
      // 确保不会小于0
      if (current > 0) {
        setCurrent(current - 1);
      }
    },
  }));

  return <AntdSteps style={styles} {...props} current={current} />;
};

export default forwardRef(StepsProd);
