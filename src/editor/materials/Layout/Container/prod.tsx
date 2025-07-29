import { type CommonComponentProps } from "../../../interface";

/**
 * @description Container 组件的“生产”版本，用于预览和最终渲染。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const ContainerProd = ({ children, styles }: CommonComponentProps) => {
  return (
    <div style={styles} className={`p-[20px]`}>
      {children}
    </div>
  );
};

export default ContainerProd;
