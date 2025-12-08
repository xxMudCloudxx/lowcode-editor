/**
 * @file Card/index.tsx
 * @description 纯净的 Card 物料组件（容器组件）
 */
import { forwardRef } from "react";
import { Card as AntdCard, type CardProps as AntdCardProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface CardProps extends MaterialProps, AntdCardProps {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, style, className, title, bordered, hoverable, ...restProps },
    ref
  ) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <AntdCard title={title} bordered={bordered} hoverable={hoverable}>
          {children}
        </AntdCard>
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
