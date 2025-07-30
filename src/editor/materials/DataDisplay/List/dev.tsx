// src/editor/materials/DataDisplay/List/dev.tsx
import React, { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { List as AntdList } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";

const ListDev = ({
  id,
  name,
  children,
  isSelected,
  styles,
  ...props
}: CommonComponentProps) => {
  const { isOver, drop } = useMaterailDrop(id, name);
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  useEffect(() => {
    drop(divRef);
    drag(divRef);
  }, [drag, drop]);

  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : !!children;

  return (
    <div
      ref={divRef}
      data-component-id={id}
      style={styles}
      className={`p-1 -ml-px -mt-px ${
        isSelected
          ? ""
          : `border border-dashed border-gray-400 ${
              isOver ? "outline outline-blue-500" : ""
            }`
      }`}
    >
      <AntdList
        style={styles}
        {...props}
        dataSource={React.Children.toArray(children)}
        renderItem={(item: React.ReactNode) => item}
      />
      {!hasChildren && (
        <div className="h-[80px] w-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm select-none pointer-events-none">
          请拖拽“列表项”组件到这里
        </div>
      )}
    </div>
  );
};

export default ListDev;
