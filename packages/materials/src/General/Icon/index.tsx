/**
 * @file Icon/index.tsx
 * @description 纯净的 Icon 物料组件
 *
 * 使用 @ant-design/icons 动态渲染图标
 * 必须使用 forwardRef 支持 ref 转发
 */
import { forwardRef, type HTMLAttributes } from "react";
import * as AntdIcons from "@ant-design/icons";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** 图标名称 (如 HomeOutlined) */
  icon?: string;
  /** 是否旋转 */
  spin?: boolean;
  /** 旋转角度 */
  rotate?: number;
}

/**
 * 动态图标渲染组件
 * 根据 icon 名称从 @ant-design/icons 中获取对应组件
 */
const DynamicIcon = ({
  icon,
  spin,
  rotate,
}: {
  icon?: string;
  spin?: boolean;
  rotate?: number;
}) => {
  if (!icon) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (AntdIcons as any)[icon];
  return IconComponent ? <IconComponent spin={spin} rotate={rotate} /> : null;
};

/**
 * Icon 物料组件
 *
 * 由于 Antd Icon 本身是 SVG，不支持 ref 转发到 DOM
 * 我们用 span 包裹来接收 ref
 */
const Icon = forwardRef<HTMLSpanElement, IconProps>(
  ({ icon, spin, rotate, style, ...restProps }, ref) => {
    return (
      <span ref={ref} style={style} {...restProps}>
        <DynamicIcon icon={icon} spin={spin} rotate={rotate} />
      </span>
    );
  }
);

Icon.displayName = "Icon";

export default Icon;
