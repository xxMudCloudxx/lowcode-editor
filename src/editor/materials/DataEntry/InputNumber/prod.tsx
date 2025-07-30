import { InputNumber as AntdInputNumber } from "antd";
import type { CommonComponentProps } from "../../../interface";

const InputNumberProd = ({
  styles,
  id,
  children,
  ...props
}: CommonComponentProps) => {
  return <AntdInputNumber {...props} id={String(id)} style={styles} />;
};

export default InputNumberProd;
