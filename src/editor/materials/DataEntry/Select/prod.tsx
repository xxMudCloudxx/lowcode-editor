import { Select as AntdSelect } from "antd";
import type { CommonComponentProps } from "../../../interface";

const SelectProd = ({
  styles,
  id,
  children,
  ...props
}: CommonComponentProps) => {
  return <AntdSelect {...props} id={String(id)} style={styles} />;
};

export default SelectProd;
