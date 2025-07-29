import { Button as AntdButton } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

/**
 * @description Button 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const ButtonDev = ({
  type,
  text,
  id,
  styles,
  ...antProps
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: "Button",
    item: {
      type: "Button",
      dragType: "move",
      id: id,
    },
  });
  return (
    <AntdButton
      type={type}
      data-component-id={id}
      style={styles}
      ref={drag}
      {...antProps}
    >
      {text}
    </AntdButton>
  );
};

export default ButtonDev;
