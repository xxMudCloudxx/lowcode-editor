import type { CommonComponentProps } from "../../interface";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";

/**
 * @description Page 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function PageDev({
  children,
  id,
  styles,
  name,
  isSelected,
}: CommonComponentProps) {
  const { isOver, drop } = useMaterailDrop(id, name);
  return (
    <div
      ref={drop}
      className={`p-[20px] h-[100%] box-border ${
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : `border border-solid border-[#000] ${
              isOver ? "outline  outline-blue-500" : ""
            }` // 否则，显示常规边框和悬浮轮廓
      }`}
      data-component-id={id}
    >
      {children}
    </div>
  );
}

export default PageDev;
