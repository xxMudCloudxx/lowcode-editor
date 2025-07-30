import { Slider as AntdSlider } from "antd";
import type { CommonComponentProps } from "../../../interface";

const SliderProd = ({
  styles,
  id,
  children,
  ...props
}: CommonComponentProps) => {
  return <AntdSlider {...props} id={String(id)} style={styles} />;
};

export default SliderProd;
