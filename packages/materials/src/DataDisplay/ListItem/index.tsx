/**
 * @file ListItem/index.tsx
 * @description 纯净的 ListItem 物料组件（容器组件）
 */
import { forwardRef } from "react";
import { List } from "antd";
import type { MaterialProps } from "../../interface";

export interface ListItemProps extends MaterialProps {}

const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ children, style, className, ...restProps }, ref) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <List.Item>{children}</List.Item>
      </div>
    );
  }
);

ListItem.displayName = "ListItem";

export default ListItem;
