import { Tooltip as AntdTooltip } from "antd";
import type { CommonComponentProps } from "../../../interface";

const TooltipProd = ({
  styles,
  children,
  id,
  ...props
}: CommonComponentProps) => {
  return (
    <AntdTooltip {...props} id={String(id)} style={styles}>
      {children}
    </AntdTooltip>
  );
};

export default TooltipProd;
