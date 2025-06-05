import { Button as AntdButton } from "antd";
import type { CommonComponentProps } from "../../interface";
import { useDrag } from "react-dnd";

const ButtonDev = ({ type, text, id, styles }: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: "Button",
    item: {
      type: "Button",
      dragType: "move",
      id: id,
    },
  });
  return (
    <AntdButton type={type} data-component-id={id} style={styles} ref={drag}>
      {text}
    </AntdButton>
  );
};

export default ButtonDev;
