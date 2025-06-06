import React, { useEffect, useMemo, useRef } from "react";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../interface";
import { Form as AntdForm, Input } from "antd";
import { useDrag } from "react-dnd";

/**
 * @description Form 组件的“生产”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function FormDev({ id, name, children, onFinish }: CommonComponentProps) {
  const [form] = AntdForm.useForm();

  const { canDrop, drop } = useMaterailDrop(id, name);

  const divRef = useRef<HTMLDivElement>(null);

  const [_, drag] = useDrag({
    type: name,
    item: {
      type: name,
      dragType: "move",
      id: id,
    },
  });

  useEffect(() => {
    drop(divRef);
    drag(divRef);
  }, []);

  const formItems = useMemo(() => {
    return React.Children.map(children, (item: any) => {
      return {
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        id: item.props?.id,
      };
    });
  }, [children]);

  return (
    <div
      className={`w-[100%] p-[20px] min-h-[100px] ${
        canDrop ? "border-[2px] border-[blue]" : "border-[1px] border-[#000]"
      }`}
      ref={divRef}
      data-component-id={id}
    >
      <AntdForm
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        form={form}
        onFinish={(values) => {
          onFinish && onFinish(values);
        }}
      >
        {formItems.map((item: any) => {
          return (
            <AntdForm.Item
              key={item.name}
              data-component-id={item.id}
              name={item.name}
              label={item.label}
            >
              <Input style={{ pointerEvents: "none" }} />
            </AntdForm.Item>
          );
        })}
      </AntdForm>
    </div>
  );
}

export default FormDev;
