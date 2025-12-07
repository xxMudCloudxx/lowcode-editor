/**
 * @file Avatar/index.tsx
 * @description 纯净的 Avatar 物料组件
 */
import { forwardRef } from "react";
import {
  Avatar as AntdAvatar,
  type AvatarProps as AntdAvatarProps,
} from "antd";
import * as Icons from "@ant-design/icons";
import type { MaterialProps } from "../../interface";

export interface AvatarProps extends MaterialProps, AntdAvatarProps {}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ style, className, icon, size, shape, src, alt, ...restProps }, ref) => {
    // 动态获取 icon 组件
    const IconComponent =
      icon && typeof icon === "string" ? (Icons as any)[icon] : null;

    return (
      <span
        ref={ref}
        className={className}
        style={{ display: "inline-block", ...style }}
      >
        <AntdAvatar
          size={size}
          shape={shape}
          src={src}
          alt={alt}
          icon={IconComponent ? <IconComponent /> : icon}
          {...restProps}
        />
      </span>
    );
  }
);

Avatar.displayName = "Avatar";

export default Avatar;
