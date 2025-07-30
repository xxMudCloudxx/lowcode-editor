import { Slider as AntdSlider } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const SliderDev = ({
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
    <div
      ref={drag}
      data-component-id={id}
      style={{ display: "inline-block", width: "200px" }}
    >
      <AntdSlider {...props} style={styles} />
    </div>
  );
};

export default SliderDev;
