import { Input as AntdInput } from "antd";
import type { CommonComponentProps } from "../../../interface";

const InputProd = ({
  styles,
  children,
  id,
  ...props
}: CommonComponentProps) => {
  return <AntdInput {...props} id={String(id)} style={styles} />;
};

export default InputProd;
