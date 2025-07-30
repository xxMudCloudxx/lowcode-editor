// src/editor/materials/DataDisplay/List/prod.tsx
import React from "react";
import { List as AntdList } from "antd";
import type { CommonComponentProps } from "../../../interface";

const ListProd = ({ children, id, styles, ...props }: CommonComponentProps) => {
  return (
    <AntdList
      style={styles}
      id={String(id)}
      {...props}
      dataSource={React.Children.toArray(children)}
      renderItem={(item: React.ReactNode) => item}
    />
  );
};

export default ListProd;
