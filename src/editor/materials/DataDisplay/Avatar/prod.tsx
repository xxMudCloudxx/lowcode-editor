// src/editor/materials/DataDisplay/Avatar/prod.tsx
import { Avatar as AntdAvatar } from "antd";
import * as AntdIcons from "@ant-design/icons";
import type { CommonComponentProps } from "../../../interface";

const DynamicIcon = (props: { icon: string; [key: string]: any }) => {
  const { icon, ...rest } = props;
  const IconComponent = (AntdIcons as any)[icon];
  return IconComponent ? <IconComponent {...rest} /> : null;
};

const AvatarProd = ({ styles, icon, ...props }: CommonComponentProps) => {
  const iconNode = icon ? <DynamicIcon icon={icon} /> : undefined;

  return (
    <AntdAvatar style={styles} {...props} icon={iconNode}>
      {props.children}
    </AntdAvatar>
  );
};

export default AvatarProd;
