import { Steps as AntdSteps } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useRef } from "react";

const StepsDev = ({ id, styles, ...antProps }: CommonComponentProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: "Steps",
    item: {
      type: "Steps",
      dragType: "move",
      id: id,
    },
  });

  drag(divRef);

  return (
    <div ref={divRef} data-component-id={id} style={styles}>
      <AntdSteps style={styles} {...antProps} />
    </div>
  );
};

export default StepsDev;
