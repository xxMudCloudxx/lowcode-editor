import { Steps as AntdSteps } from "antd";
import type { CommonComponentProps } from "../../../interface";

const StepsProd = ({ id, styles, ...props }: CommonComponentProps) => {
  return <AntdSteps style={styles} {...props} />;
};

export default StepsProd;
