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
  visibleInEditor,
}: CommonComponentProps) {
  const { isOver, drop } = useMaterailDrop(id, name);

  //  核心逻辑：当组件“在编辑器中不可见”且“未被选中”时，不渲染任何内容
  if (!visibleInEditor && !isSelected) {
    // 虽然不渲染，但我们仍然需要一个虚拟的 drop 区域，
    // 以便能从大纲树选中它。这里返回 null 即可，
    // 因为选中逻辑是基于 data-component-id，而这个 ID 存在于大纲树中。
    // 注意：这种状态下无法直接向其拖拽组件，必须先从大纲树选中。
    return null;
  }

  // 当组件可见或被选中时，正常渲染占位符
  return (
    <div
      ref={drop}
      style={styles}
      data-component-id={id}
      className={`min-h-[100px] p-5 -ml-px -mt-px ${
        isSelected
          ? ""
          : `border border-black ${isOver ? "outline outline-blue-600" : ""}`
      }`}
    >
      <h4>{title}</h4>
      <div>{children}</div>
    </div>
  );
}

export default ModalDev;
