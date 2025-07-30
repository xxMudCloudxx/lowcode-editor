// src/editor/materials/General/Icon/prod.tsx
import type { CommonComponentProps } from "../../../interface";
import * as AntdIcons from "@ant-design/icons";

const DynamicIcon = (props: { icon: string; [key: string]: any }) => {
  const { icon, ...rest } = props;
  const IconComponent = (AntdIcons as any)[icon];
  return IconComponent ? <IconComponent {...rest} /> : null;
};

const IconProd = ({
  styles,
  icon, // 显式解构 icon
  ...restProps // 收集其余 props
}: CommonComponentProps) => {
  return (
    <span style={styles}>
      {/* 3. 分别传入 icon 和 restProps */}
      <DynamicIcon icon={icon} {...restProps} />
    </span>
  );
};

export default IconProd;
