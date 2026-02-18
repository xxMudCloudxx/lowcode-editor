/**
 * @file Container/index.tsx
 * @description 纯净的 Container 物料组件
 *
 * 作为布局容器，可以包含其他组件
 * 必须使用 forwardRef 支持 ref 转发
 *
 * 注意：编辑器特有的样式（边框、占位符）通过 CSS 作用域注入，
 * 组件本身保持完全纯净，可在任何环境中复用。
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** 子组件 */
  children?: ReactNode;
}

/**
 * Container 物料组件
 * 一个简单的 div 容器，用于包裹其他组件
 */
const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, style, className, ...restProps }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: "100%", ...style }}
        className={className}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export default Container;
