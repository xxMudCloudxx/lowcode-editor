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
import { forwardRef, type ReactNode, type Ref, Children } from "react";

export interface ButtonProps extends AntdButtonProps {
  /**
   * 按钮文本（便捷属性）
   *
   * 优先级说明：
   * - 如果同时设置 text 和 children，优先使用 children
   * - text 仅作为快捷配置，不应与 children 同时使用
   */
  text?: ReactNode;
}

/**
 * Button 物料组件
 *
 * - 完全透传 Antd Button 的所有属性
 * - 支持 text 属性作为 children 的便捷写法
 * - children 优先级高于 text（允许拖入子组件覆盖文本）
 * - 使用 forwardRef 确保编辑器可以注入 ref
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ text, children, ...props }, ref) => {
    // 使用 React.Children.count 正确判断 children 是否有内容
    const hasChildren = Children.count(children) > 0;
    return (
      <AntdButton ref={ref as Ref<HTMLButtonElement>} {...props}>
        {hasChildren ? children : text}
      </AntdButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
