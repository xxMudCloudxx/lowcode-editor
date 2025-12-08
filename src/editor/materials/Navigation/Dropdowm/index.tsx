/**
 * @file Dropdown/index.tsx
 * @description 纯净的下拉菜单组件
 *
 * 注意：文件夹名是 Dropdowm（拼写错误），但组件名正确为 Dropdown
 */
import { forwardRef } from "react";
import {
  Dropdown as AntdDropdown,
  Button,
  type DropdownProps as AntdDropdownProps,
} from "antd";
import type { MaterialProps } from "../../interface";

export interface DropdownProps
  extends MaterialProps,
    Omit<AntdDropdownProps, "children"> {
  /** 按钮文字 */
  buttonText?: string;
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ style, className, menu, buttonText = "下拉菜单", ...restProps }, ref) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <AntdDropdown menu={menu}>
          <Button>{buttonText}</Button>
        </AntdDropdown>
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
