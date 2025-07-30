import { Select as AntdSelect } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const SelectDev = ({
  id,
  name,
  styles,
  children,
  ...props
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <div ref={drag} data-component-id={id} style={{ display: "inline-block" }}>
      <AntdSelect {...props} style={styles} />
    </div>
  );
};

export default SelectDev;
