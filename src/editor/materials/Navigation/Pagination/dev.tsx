import { Pagination as AntdPagination } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useRef } from "react";

const PaginationDev = ({
  id,
  name,
  styles,
  isSelected,
  children,
  ...rest
}: CommonComponentProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: "Pagination",
    item: {
      type: "Pagination",
      dragType: "move",
      id: id,
    },
  });

  drag(divRef);

  return (
    <div ref={divRef} data-component-id={id} style={{ ...styles }}>
      {/* 只把干净的 rest props 传递给 Antd 组件 */}
      <AntdPagination {...rest} />
    </div>
  );
};

export default PaginationDev;
