import type { CommonComponentProps } from "../../interface";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";

function Page({ children, id, name }: CommonComponentProps) {
  const { canDrop, drop } = useMaterailDrop(["Button", "Container"], id);
  return (
    <div
      ref={drop}
      className="p-[20px] h-[100%] box-border"
      style={{ border: canDrop ? "2px solid blue" : "none" }}
    >
      {children}
    </div>
  );
}

export default Page;
