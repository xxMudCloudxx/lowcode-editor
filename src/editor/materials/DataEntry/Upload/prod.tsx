import { Upload as AntdUpload } from "antd";
import type { CommonComponentProps } from "../../../interface";

const UploadProd = ({ styles, id, ...props }: CommonComponentProps) => {
  return <AntdUpload {...props} id={String(id)} style={styles} />;
};

export default UploadProd;
