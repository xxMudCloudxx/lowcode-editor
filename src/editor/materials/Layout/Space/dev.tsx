import { Space as AntdSpace } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import { useEffect, useRef } from "react";

/**
 * @description Space 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const SpaceDev = ({
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
      className={`p-1 -ml-px -mt-px inline-flex ${
        // 使用 inline-flex 使其尺寸包裹内容
        isSelected
          ? ""
          : `border border-dashed border-gray-400 ${
              isOver ? "outline outline-blue-500" : ""
            }`
      }`}
    >
      <AntdSpace style={styles} {...props}>
        {hasChildren ? (
          children
        ) : (
          <div className="min-h-[40px] min-w-[120px] flex items-center justify-center bg-gray-50 text-gray-400 text-sm select-none pointer-events-none">
            拖拽组件到这里
          </div>
        )}
      </AntdSpace>
    </div>
  );
};

export default SpaceDev;
