// src/editor/materials/General/Icon/dev.tsx
import { useDrag } from "react-dnd";
import type { CommonComponentProps } from "../../../interface";
import * as AntdIcons from "@ant-design/icons";

// 动态图标渲染组件 (保持不变)
const DynamicIcon = (props: { icon: string; [key: string]: any }) => {
  const { icon, ...rest } = props;
  const IconComponent = (AntdIcons as any)[icon];
  return IconComponent ? <IconComponent {...rest} /> : null;
};

const IconDev = ({
  id,
  name,
  styles,
  icon,
  ...restProps
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <span ref={drag} data-component-id={id}>
      {/* 3. 将解构出的 icon 和剩余的 restProps 传递给 DynamicIcon */}
      <DynamicIcon icon={icon} style={styles} {...restProps} />
    </span>
  );
};

export default IconDev;
