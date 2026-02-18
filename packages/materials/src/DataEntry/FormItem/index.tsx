/**
 * @file FormItem/index.tsx
 * @description 纯净的 FormItem 物料组件
 *
 * 注意：FormItem 在低代码场景通常只作为占位使用，
 * 真正的表单渲染由 Form 组件统一处理
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Form as AntdForm } from "antd";

export interface FormItemProps extends HTMLAttributes<HTMLDivElement> {
  /** 字段名 */
  name?: string | number;
  /** 标签 */
  label?: ReactNode;
  /** 字段类型 */
  type?: "input" | "date";
  /** 校验规则 */
  rules?: string;
  /** 子组件 */
  children?: ReactNode;
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ name, label, children, style, className, ...restProps }, ref) => {
    return (
      <div ref={ref} style={style} className={className} {...restProps}>
        <AntdForm.Item name={name} label={label}>
          {children}
        </AntdForm.Item>
      </div>
    );
  }
);

FormItem.displayName = "FormItem";

export default FormItem;
