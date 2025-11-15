import React, { useEffect, useMemo, useRef } from "react";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { Table as AntdTable } from "antd";
import { useComponentsStore } from "../../../stores/components";

/**
 * @description Table 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function TableDev({
  id,
  name,
  children,
  styles,
  isSelected,
  ...antProps
}: CommonComponentProps) {
  const { isOver, drop } = useMaterailDrop(id, name);

  const divRef = useRef<HTMLDivElement>(null);

  const { components } = useComponentsStore();

  const [_, drag] = useDrag({
    type: name,
    item: {
      type: name,
      dragType: "move",
      id,
    },
  });

  useEffect(() => {
    drop(divRef);
    drag(divRef);
  }, []);

  const columns = useMemo(() => {
    const list =
      React.Children.map(children, (renderNodeElement: any) => {
        if (!renderNodeElement) return null;

        const childId = renderNodeElement.props.id;
        if (!childId) return null;

        const componentData = components[childId];
        if (!componentData) return null;

        return {
          title: (
            <div
              className="m-[-16px] p-[16px]"
              data-component-id={componentData?.id}
            >
              {componentData.props.title}
            </div>
          ),
          dataIndex: componentData.props.dataIndex,
          key: componentData.id,
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
      style={styles}
    >
      <AntdTable
        columns={columns}
        dataSource={[]}
        pagination={false}
        {...antProps}
      />
    </div>
  );
}

export default TableDev;
