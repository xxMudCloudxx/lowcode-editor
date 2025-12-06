import type { CommonComponentProps } from "../../../interface";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { Row } from "antd";

/**
 * @description Grid 组件的"开发"版本，用于编辑器画布内，使用antd的Row组件。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const GridDev = ({
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

  return (
    <Row
      ref={divRef}
      className={`min-h-[100px] -ml-px -mt-px ${
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : `border border-black ${isOver ? "outline outline-blue-600" : ""}` // 否则，显示常规边框和悬浮轮廓
      }`}
      data-component-id={id}
      style={styles}
      gutter={props.gutter}
      justify={props.justify}
      align={props.align}
      wrap={props.wrap}
    >
      {children}
    </Row>
  );
};

export default GridDev;
