import React, { useEffect, useMemo, useRef } from "react";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { Table as AntdTable } from "antd";

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
      React.Children.map(children, (suspenseElement: any) => {
        if (!suspenseElement) return null;

        const item = suspenseElement.props?.children;
        // 兼容性保护：如果某个 child 不是预期结构，直接跳过
        if (!item || !item.props) return null;

        return {
          title: (
            <div
              className="m-[-16px] p-[16px]"
              data-component-id={item.props.id}
            >
              {item.props.title}
            </div>
          ),
          dataIndex: item.props.dataIndex,
          key: item.props.id,
        };
      })?.filter(Boolean) || [];

    return list;
  }, [children]);

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

