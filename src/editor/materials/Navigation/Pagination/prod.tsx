import { Pagination as AntdPagination } from "antd";
import type { CommonComponentProps } from "../../../interface";

const PaginationProd = ({
  id,
  name,
  styles,
  isSelected,
  children,
  // 剩余的属性收集到 rest 中
  ...rest
}: CommonComponentProps) => {
  // 现在 rest 中只包含 total, defaultCurrent 等 Pagination 自己的属性
  return <AntdPagination style={styles} {...rest} />;
};

export default PaginationProd;
