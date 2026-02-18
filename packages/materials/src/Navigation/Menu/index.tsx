/**
 * @file Menu/index.tsx
 * @description 纯净的导航菜单组件
 */
import { forwardRef } from "react";
import { Menu as AntdMenu, type MenuProps as AntdMenuProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface MenuProps
  extends MaterialProps,
    Omit<AntdMenuProps, keyof MaterialProps> {}

const Menu = forwardRef<HTMLDivElement, MenuProps>(
  (
    {
      style,
      className,
      items,
      mode,
      theme,
      "data-component-id": id,
      children,
      ...restProps
    },
    ref
  ) => {
    return (
      <div ref={ref} data-component-id={id} style={style} className={className}>
        <AntdMenu items={items} mode={mode} theme={theme} {...restProps} />
      </div>
    );
  }
);

Menu.displayName = "Menu";

export default Menu;
