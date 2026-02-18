/**
 * @file Image/index.tsx
 * @description 纯净的 Image 物料组件
 */
import { forwardRef } from "react";
import { Image as AntdImage, type ImageProps as AntdImageProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface ImageProps extends MaterialProps, AntdImageProps {}

const Image = forwardRef<HTMLDivElement, ImageProps>(
  (
    {
      style,
      className,
      width,
      height,
      src,
      alt,
      preview,
      fallback,
      ...restProps
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{ display: "inline-block", ...style }}
      >
        <AntdImage
          width={width}
          height={height}
          src={src}
          alt={alt}
          preview={preview}
          fallback={fallback}
          {...restProps}
        />
      </div>
    );
  }
);

Image.displayName = "Image";

export default Image;
