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
    <div
      ref={drag}
      data-component-id={id}
      style={{ display: "inline-block" }} // 让外壳尺寸包裹按钮
    >
      <AntdButton
        type={type}
        // 注意：data-component-id 已经移到外壳上
        style={{
          ...styles,
          pointerEvents: "none", // 禁用“内核”的鼠标事件
        }}
        // 注意：ref 已经移到外壳上
        {...antProps}
      >
        {text}
      </AntdButton>
    </div>
  );
};

export default ButtonDev;
