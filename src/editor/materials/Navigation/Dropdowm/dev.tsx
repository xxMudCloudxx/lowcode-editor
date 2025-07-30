import { Dropdown as AntdDropdown, Button } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useRef } from "react";

const DropdownDev = ({ id, styles, ...antProps }: CommonComponentProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: "Dropdown",
    item: {
      type: "Dropdown",
      dragType: "move",
      id: id,
    },
  });

  drag(divRef);

  return (
    // dev 版本中，我们禁用实际的下拉功能以方便在画布中选中和拖拽
    <div ref={divRef} data-component-id={id} style={styles}>
      <Button>{antProps.buttonText}</Button>
    </div>
  );
};

export default DropdownDev;
