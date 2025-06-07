import { Button as AntdButton } from "antd";
import type { CommonComponentProps } from "../../interface";

/**
 * @description Button 组件的“生产”版本，用于预览和最终渲染。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const ButtonProd = ({
  id,
  type,
  text,
  styles,
  ...props
}: CommonComponentProps) => {
  return (
    <AntdButton type={type} style={styles} {...props}>
      {text}
    </AntdButton>
  );
};

export default ButtonProd;
