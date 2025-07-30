import { Breadcrumb as AntdBreadcrumb } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useRef } from "react";

const BreadcrumbDev = ({ id, styles, ...antProps }: CommonComponentProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: "Breadcrumb",
    item: {
      type: "Breadcrumb",
      dragType: "move",
      id: id,
    },
  });

  drag(divRef);

  return (
    <div ref={divRef} data-component-id={id} style={styles}>
      {/* Antd 组件仅用于展示 */}
      <AntdBreadcrumb {...antProps} style={styles} />
    </div>
  );
};

export default BreadcrumbDev;
