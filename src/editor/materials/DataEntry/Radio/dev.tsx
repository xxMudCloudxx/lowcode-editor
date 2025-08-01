import { Radio as AntdRadio } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const RadioDev = ({ id, name, styles, ...props }: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <div ref={drag} data-component-id={id} style={{ display: "inline-block" }}>
      <AntdRadio.Group
        {...props}
        style={{ ...styles, pointerEvents: "none" }}
      />
    </div>
  );
};

export default RadioDev;
