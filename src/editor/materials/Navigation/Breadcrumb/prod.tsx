import { Breadcrumb as AntdBreadcrumb } from "antd";
import type { CommonComponentProps } from "../../../interface";

const BreadcrumbProd = ({ id, styles, ...props }: CommonComponentProps) => {
  // 直接渲染 Antd 组件，并传入所有 props
  return <AntdBreadcrumb style={styles} {...props} />;
};

export default BreadcrumbProd;
