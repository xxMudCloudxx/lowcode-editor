import React, { useEffect, useMemo, useRef } from "react";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../../interface";
import { Form as AntdForm, Input } from "antd";
import { useDrag } from "react-dnd";
import { useComponentsStore } from "../../../stores/components";

/**
 * @description Form 组件的“生产”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function FormDev({
  id,
  name,
  children,
  onFinish,
  isSelected,
  ...antProps
}: CommonComponentProps) {
  const [form] = AntdForm.useForm();

  const { components } = useComponentsStore();

  const { isOver, drop } = useMaterailDrop(id, name);

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
    const list =
      React.Children.map(children, (suspenseElement: any) => {
        if (!suspenseElement) return null;

        const itemId = suspenseElement.props?.id;
        if (!itemId) return null;

        const item = components[itemId];
        // 兼容性保护：如果不是预期的子节点结构，直接跳过
        if (!item || !item.props) return null;

        return {
          label: item.props.label,
          name: item.props.name,
          type: item.props.type,
          id: itemId,
        };
      })?.filter(Boolean) || [];

    return list;
  }, [children, components]);

  return (
    <div
      className={`min-h-[100px] p-[20px] -ml-px -mt-px ${
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : `border-[1px] border-[#000] ${
              isOver ? "outline outline-blue-600" : ""
            }` // 否则，显示常规边框和悬浮轮廓
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
        {...antProps}
      >
        {formItems.map((item: any) => {
          return (
            <AntdForm.Item
              key={item.id}
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
