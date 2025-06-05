import type { CommonComponentProps } from "../../interface";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";

const ContainerDev = ({ id, children, styles, name }: CommonComponentProps) => {
  const { canDrop, drop } = useMaterailDrop(["Button", "Container"], id);

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
      className={`min-h-[100px] p-[20px] ${
        canDrop ? "border-[2px] border-[blue]" : "border-[1px] border-[#000]"
      }`}
      data-component-id={id}
      style={styles}
    >
      {children}
    </div>
  );
};

export default ContainerDev;
