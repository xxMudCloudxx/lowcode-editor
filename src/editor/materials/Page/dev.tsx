import type { CommonComponentProps } from "../../interface";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";

function PageDev({ children, id, name, styles }: CommonComponentProps) {
  const { canDrop, drop } = useMaterailDrop(
    ["Button", "Container", "Modal"],
    id
  );
  return (
    <div
      ref={drop}
      className="p-[20px] h-[100%] box-border"
      style={{ ...styles, border: canDrop ? "2px solid blue" : "none" }}
      data-component-id={id}
    >
      {children}
    </div>
  );
}

export default PageDev;
