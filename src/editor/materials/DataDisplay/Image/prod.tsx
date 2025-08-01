import { Image as AntdImage } from "antd";
import type { CommonComponentProps } from "../../../interface";

const ImageProd = ({ styles, id, ...props }: CommonComponentProps) => {
  return <AntdImage {...props} id={String(id)} style={styles} />;
};

export default ImageProd;
