// src/editor/materials/DataDisplay/Card/prod.tsx
import { Card as AntdCard } from "antd";
import type { CommonComponentProps } from "../../../interface";

const CardProd = ({ children, styles, id, ...props }: CommonComponentProps) => {
  return (
    <AntdCard style={styles} id={String(id)} {...props}>
      {children}
    </AntdCard>
  );
};

export default CardProd;
