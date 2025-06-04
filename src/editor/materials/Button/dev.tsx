import { Button as AntdButton } from "antd";
import type { CommonComponentProps } from "../../interface";

const ButtonDev = ({ type, text, id, styles }: CommonComponentProps) => {
  return (
    <AntdButton type={type} data-component-id={id} style={styles}>
      {text}
    </AntdButton>
  );
};

export default ButtonDev;
