import { Switch as AntdSwitch } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const SwitchDev = ({
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
      <AntdSwitch {...props} style={styles} />
    </div>
  );
};

export default SwitchDev;
