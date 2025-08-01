import { Radio as AntdRadio } from "antd";
import type { CommonComponentProps } from "../../../interface";

const RadioProd = ({ styles, id, ...props }: CommonComponentProps) => {
  return <AntdRadio.Group {...props} id={String(id)} style={styles} />;
};

export default RadioProd;
