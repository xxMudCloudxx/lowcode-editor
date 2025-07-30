import { Dropdown as AntdDropdown, Button } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { DownOutlined } from "@ant-design/icons";

const DropdownProd = ({ id, styles, ...props }: CommonComponentProps) => {
  return (
    <AntdDropdown menu={props.menu} trigger={[props.trigger]}>
      <Button style={styles}>
        {props.buttonText} <DownOutlined />
      </Button>
    </AntdDropdown>
  );
};

export default DropdownProd;
