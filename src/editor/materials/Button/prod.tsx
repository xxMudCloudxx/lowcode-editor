import { Button as AntdButton } from "antd";
import type { CommonComponentProps } from "../../interface";

const ButtonProd = ({
  id,
  type,
  text,
  styles,
  ...props
}: CommonComponentProps) => {
  return (
    <AntdButton type={type} style={styles} {...props}>
      {text}
    </AntdButton>
  );
};

export default ButtonProd;
