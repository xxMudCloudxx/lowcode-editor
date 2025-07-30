// src/editor/materials/Navigation/TabPane/dev.tsx
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";

const TabPaneDev = ({
  id,
  name,
  children,
  isSelected,
  styles,
}: CommonComponentProps) => {
  const { isOver, drop } = useMaterailDrop(id, name);
  const divRef = useRef<HTMLDivElement>(null);

  // TabPane 自身也需要可拖拽，以便在 Tabs 内排序
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
      className={`min-h-[100px] p-4 ${
        isSelected
          ? ""
          : `border border-dashed border-gray-300 ${
              isOver ? "outline outline-blue-500" : ""
            }`
      }`}
    >
      {hasChildren ? (
        children
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm select-none pointer-events-none">
          拖拽组件到这里
        </div>
      )}
    </div>
  );
};

export default TabPaneDev;
