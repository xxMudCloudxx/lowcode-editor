/**
 * @file Button/index.tsx
 * @description 纯净的 Button 物料组件
 *
 * 设计原则：
 * 1. 只负责 UI 渲染，不感知编辑器
 * 2. 完全透传 Antd Button 的所有属性
 * 3. 使用 forwardRef 支持 ref 转发（协议强制要求）
 *
 * @important 必须使用 forwardRef，否则拖拽功能失效！
 */
import {
  Button as AntdButton,
  type ButtonProps as AntdButtonProps,
} from "antd";
import { forwardRef, type ReactNode, type Ref } from "react";

export interface ButtonProps extends AntdButtonProps {
  /** 按钮文本（便捷属性，等同于 children） */
  text?: ReactNode;
}

/**
 * Button 物料组件
 *
 * - 完全透传 Antd Button 的所有属性
 * - 支持 text 属性作为 children 的便捷写法
 * - 使用 forwardRef 确保编辑器可以注入 ref
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ text, children, ...props }, ref) => {
    return (
      <AntdButton ref={ref as Ref<HTMLButtonElement>} {...props}>
        {text ?? children}
      </AntdButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
