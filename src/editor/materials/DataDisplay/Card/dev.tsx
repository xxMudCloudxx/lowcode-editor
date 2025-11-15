// src/editor/materials/DataDisplay/Card/dev.tsx
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { Card as AntdCard } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";

const CardDev = ({
  id,
  name,
  children,
  isSelected,
  styles,
  bordered,
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

  const variant = bordered === false ? "borderless" : "outlined";

  return (
    <div
      ref={divRef}
      data-component-id={id}
      style={styles}
      className={`-ml-px -mt-px ${
        isSelected ? "" : `${isOver ? "outline outline-blue-500" : ""}`
      }`}
    >
      <AntdCard style={styles} {...props} variant={variant}>
        {hasChildren ? (
          children
        ) : (
          <div className="min-h-[80px] w-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm select-none pointer-events-none">
            拖拽组件到这里
          </div>
        )}
      </AntdCard>
    </div>
  );
};

export default CardDev;
