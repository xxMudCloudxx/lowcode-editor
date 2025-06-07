import { type CommonComponentProps } from "../../interface";

/**
 * @description Page 组件的“生产”版本，用于预览和最终渲染。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function PageProd({ children, styles }: CommonComponentProps) {
  return (
    <div className="p-[20px]" style={{ ...styles }}>
      {children}
    </div>
  );
}

export default PageProd;
