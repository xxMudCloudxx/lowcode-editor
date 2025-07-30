import { Menu as AntdMenu } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useRef } from "react";

const MenuDev = ({ id, styles, ...antProps }: CommonComponentProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: "Menu",
    item: {
      type: "Menu",
      dragType: "move",
      id: id,
    },
  });

  drag(divRef);

  return (
    <div ref={divRef} data-component-id={id} style={{ ...styles }}>
      <AntdMenu {...antProps} style={styles} />
    </div>
  );
};

export default MenuDev;
