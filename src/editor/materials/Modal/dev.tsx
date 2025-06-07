import { useMaterailDrop } from "../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../interface";

/**
 * @description Modal 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function ModalDev({ id, children, title, styles }: CommonComponentProps) {
  const { canDrop, drop } = useMaterailDrop(
    ["Button", "Container", "Table", "Form"],
    id
  );

  return (
    <div
      ref={drop}
      style={styles}
      data-component-id={id}
      className={`min-h-[100px] p-[20px] ${
        canDrop ? "border-[2px] border-[blue]" : "border-[1px] border-[#000]"
      }`}
    >
      <h4>{title}</h4>
      <div>{children}</div>
    </div>
  );
}

export default ModalDev;
