// src/editor/materials/DataDisplay/ListItem/prod.tsx
import { List as AntdList } from "antd";
import type { CommonComponentProps } from "../../../interface";

const ListItemProd = ({ children, styles }: CommonComponentProps) => {
  return <AntdList.Item style={styles}>{children}</AntdList.Item>;
};

export default ListItemProd;
