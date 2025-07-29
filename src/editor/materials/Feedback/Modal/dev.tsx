import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../../interface";

/**
 * @description Modal 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function ModalDev({
  id,
  children,
  title,
  styles,
  name,
  isSelected,
}: CommonComponentProps) {
  const { isOver, drop } = useMaterailDrop(id, name);

  return (
    <div
      ref={drop}
      style={styles}
      data-component-id={id}
      className={`min-h-[100px] p-[20px] -ml-px -mt-px ${
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : `border-[1px] border-[#000] ${
              isOver ? "outline outline-blue-600" : ""
            }` // 否则，显示常规边框和悬浮轮廓
      }`}
    >
      <h4>{title}</h4>
      <div>{children}</div>
    </div>
  );
}

export default ModalDev;
