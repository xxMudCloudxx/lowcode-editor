import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { Col } from "antd";

/**
 * @description GridColumn 组件的"开发"版本，用于编辑器画布内，基于Container但是填充满组件，灰底，中间有"拖拽组件到这里"的文字。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const GridColumnDev = ({
  id,
  children,
  styles,
  name,
  isSelected,
  ...props
}: CommonComponentProps) => {
  const { isOver, drop } = useMaterailDrop(id, name);

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

  const hasChildren =
    children && Array.isArray(children) ? children.length > 0 : !!children;

  return (
    <Col
      ref={divRef}
      className={` p-[1px] -ml-px -mt-px flex flex-col
         ${isSelected ? "" : ` ${isOver ? "outline outline-blue-600" : ""} `} 
      `}
      data-component-id={id}
      style={styles}
      span={props.span}
      offset={props.offset}
      order={props.order}
      pull={props.pull}
      push={props.push}
    >
      {hasChildren ? (
        // 当有子组件时，子组件会自然撑开 Col 的高度
        children
      ) : (
        // 当没有子组件时，占位符需要一个 flex-grow 的能力来撑满最小高度
        <div className="min-h-[100px] w-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm select-none pointer-events-none">
          拖拽组件到这里
        </div>
      )}
    </Col>
  );
};

export default GridColumnDev;
