import { Button as AntdButton } from "antd";
import type { ButtonType } from "antd/es/button";
import type { CommonComponentProps } from "../../interface";

export interface ButtonProps {
  type: ButtonType;
  text: string;
}

const Button = ({ type, text, id }: CommonComponentProps) => {
  return (
    <AntdButton type={type} data-component-id={id}>
      {text}
    </AntdButton>
  );
};

export default Button;
