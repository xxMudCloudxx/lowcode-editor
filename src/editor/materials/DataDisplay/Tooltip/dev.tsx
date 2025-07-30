import { Tooltip as AntdTooltip, Button } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const TooltipDev = ({
  id,
  name,
  styles,
  title,
  placement,
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <div ref={drag} data-component-id={id} style={{ display: "inline-block" }}>
      <AntdTooltip title={title} placement={placement}>
        <Button style={styles}>提示</Button>
      </AntdTooltip>
    </div>
  );
};

export default TooltipDev;
