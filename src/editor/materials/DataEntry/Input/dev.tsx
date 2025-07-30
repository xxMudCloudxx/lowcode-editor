import { Input as AntdInput } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const InputDev = ({
  id,
  name,
  children,
  styles,
  ...props
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <div ref={drag} data-component-id={id} style={{ display: "inline-block" }}>
      <AntdInput {...props} style={styles} />
    </div>
  );
};

export default InputDev;
