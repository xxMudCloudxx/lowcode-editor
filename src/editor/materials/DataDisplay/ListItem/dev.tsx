// src/editor/materials/DataDisplay/ListItem/dev.tsx
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { List as AntdList } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";

const ListItemDev = ({
  id,
  name,
  children,
  isSelected,
  styles,
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
      className={`${
        isSelected ? "" : `${isOver ? "outline outline-blue-500" : ""}`
      }`}
    >
      <AntdList.Item data-component-id={id} style={styles}>
        <div className="w-full">
          {hasChildren ? (
            children
          ) : (
            <div className="min-h-[40px] w-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm select-none pointer-events-none">
              拖拽组件到这里
            </div>
          )}
        </div>
      </AntdList.Item>
    </div>
  );
};

export default ListItemDev;
