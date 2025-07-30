import { Switch as AntdSwitch } from "antd";
import type { CommonComponentProps } from "../../../interface";

const SwitchProd = ({
  styles,
  id,
  children,
  ...props
}: CommonComponentProps) => {
  return <AntdSwitch {...props} id={String(id)} style={styles} />;
};

export default SwitchProd;
