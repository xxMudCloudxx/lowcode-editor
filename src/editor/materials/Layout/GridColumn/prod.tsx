import { type CommonComponentProps } from "../../../interface";
import { Col } from "antd";

/**
 * @description GridColumnProd 组件的"生产"版本，用于预览和最终渲染，使用antd的Col组件。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const GridColumnProd = ({
  children,
  styles,
  id,
  ...props
}: CommonComponentProps) => {
  return (
    <Col style={styles} id={String(id)} {...props}>
      {children}
    </Col>
  );
};

export default GridColumnProd;
