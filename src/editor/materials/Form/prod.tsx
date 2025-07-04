import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  type ForwardRefRenderFunction,
} from "react";
import type { CommonComponentProps } from "../../interface";
import dayjs from "dayjs";
import { Form as AntdForm, DatePicker, Input } from "antd";
export interface FormRef {
  submit: () => void;
}

/**
 * @description Form 组件的“预览”版本，用于预览和最终渲染。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const Form: ForwardRefRenderFunction<
  FormRef,
  Omit<CommonComponentProps, "ref">
> = ({ children, onFinish }, ref) => {
  const [form] = AntdForm.useForm();

  useImperativeHandle(
    ref,
    () => {
      return {
        submit: () => {
          form.submit();
        },
      };
    },
    [form]
  );

  const formItems = useMemo(() => {
    return React.Children.map(children, (suspenseElement: any) => {
      if (!suspenseElement) return null;

      const item = suspenseElement.props.children;
      return {
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        id: item.props?.id,
      };
    })?.filter(Boolean);
  }, [children]);

  async function save(values: any) {
    Object.keys(values).forEach((key) => {
      if (dayjs.isDayjs(values[key])) {
        values[key] = values[key].format("YYYY-MM-DD");
      }
    });

    onFinish(values);
  }

  return (
    <AntdForm
      name="form"
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 18 }}
      form={form}
      onFinish={save}
    >
      {formItems.map((item: any) => {
        return (
          <AntdForm.Item
            key={item.name}
            name={item.name}
            label={item.label}
            rules={
              item.rules === "required"
                ? [
                    {
                      required: true,
                      message: "不能为空",
                    },
                  ]
                : []
            }
          >
            {item.type === "input" && <Input />}
            {item.type === "date" && <DatePicker />}
          </AntdForm.Item>
        );
      })}
    </AntdForm>
  );
};

export default forwardRef(Form);
