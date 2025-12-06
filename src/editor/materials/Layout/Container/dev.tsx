import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";

/**
 * @description Container 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const ContainerDev = ({
  id,
  children,
  styles,
  name,
  isSelected,
}: CommonComponentProps) => {
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

  return (
    <div
      ref={divRef}
      className={`min-h-[100px] p-5 -ml-px -mt-px ${
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : `border border-black ${isOver ? "outline outline-blue-600" : ""}` // 否则，显示常规边框和悬浮轮廓
      }`}
      data-component-id={id}
      style={styles}
    >
      {children}
    </div>
  );
};

export default ContainerDev;
