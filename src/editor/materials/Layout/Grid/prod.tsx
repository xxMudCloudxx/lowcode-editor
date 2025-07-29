import { type CommonComponentProps } from "../../../interface";
import { Row } from "antd";

/**
 * @description Grid组件的"生产"版本，用于预览和最终渲染，使用antd的Row组件。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const GridProd = ({ children, styles, id, ...props }: CommonComponentProps) => {
  return (
    <Row style={styles} id={String(id)} {...props}>
      {children}
    </Row>
  );
};

export default GridProd;
