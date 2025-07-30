import { Menu as AntdMenu } from "antd";
import type { CommonComponentProps } from "../../../interface";

const MenuProd = ({ id, styles, ...props }: CommonComponentProps) => {
  return <AntdMenu style={styles} {...props} />;
};

export default MenuProd;
