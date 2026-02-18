/**
 * @file Form/index.tsx
 * @description 纯净的 Form 物料组件
 *
 * 使用 forwardRef + useImperativeHandle 暴露表单方法
 */
import {
  forwardRef,
  useImperativeHandle,
  type ReactNode,
  type HTMLAttributes,
  useRef,
} from "react";
import { Form as AntdForm, type FormProps as AntdFormProps } from "antd";

export interface FormRef {
  submit: () => void;
}

export interface FormProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onFinish">,
    Pick<AntdFormProps, "labelCol" | "wrapperCol" | "layout" | "onFinish"> {
  /** 子组件 */
  children?: ReactNode;
  /** 表单标题 */
  title?: string;
}

const Form = forwardRef<FormRef, FormProps>(
  (
    {
      children,
      style,
      className,
      // ... 其他 props
      onFinish,
      ...restProps
    },
    ref
  ) => {
    const [form] = AntdForm.useForm();
    const divRef = useRef<HTMLDivElement>(null); // 创建内部真实 DOM Ref

    // 劫持 Ref 返回值
    useImperativeHandle(ref, () => {
      // 返回真实的 DOM 节点
      const dom = divRef.current;

      // 动态挂载 submit 方法
      // 注意：这种做法虽然是 "Dirty Hack"，但在低代码这种强依赖 Ref 的场景下是标准解法
      if (dom) {
        (dom as any).submit = () => form.submit();
      }

      return dom as unknown as FormRef;
    }, [form]);

    return (
      <div
        ref={divRef} // 绑定内部 Ref 到 div
        style={style}
        className={className}
        {...restProps}
      >
        <AntdForm
          form={form}
          // ... 传递 props
          onFinish={onFinish}
        >
          {children}
        </AntdForm>
      </div>
    );
  }
);

Form.displayName = "Form";
export default Form;
