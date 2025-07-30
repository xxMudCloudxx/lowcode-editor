// src/editor/materials/DataDisplay/Avatar/dev.tsx
import { useDrag } from "react-dnd";
import { Avatar as AntdAvatar } from "antd";
import * as AntdIcons from "@ant-design/icons";
import type { CommonComponentProps } from "../../../interface";

// 动态图标渲染
const DynamicIcon = (props: { icon: string; [key: string]: any }) => {
  const { icon, ...rest } = props;
  const IconComponent = (AntdIcons as any)[icon];
  return IconComponent ? <IconComponent {...rest} /> : null;
};

const AvatarDev = ({
  id,
  name,
  styles,
  icon,
  ...props
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  // Antd Avatar 的 icon 属性需要一个 ReactNode，而不是字符串
  const iconNode = icon ? <DynamicIcon icon={icon} /> : undefined;

  return (
    <div
      ref={drag}
      data-component-id={id}
      style={{ display: "inline-block", ...styles }}
    >
      <AntdAvatar {...props} icon={iconNode} style={styles} />
    </div>
  );
};

export default AvatarDev;
