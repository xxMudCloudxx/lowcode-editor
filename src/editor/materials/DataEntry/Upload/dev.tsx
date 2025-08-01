import { Upload as AntdUpload, Button } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { UploadOutlined } from "@ant-design/icons";

const UploadDev = ({ id, name, styles, ...props }: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <div ref={drag} data-component-id={id} style={{ display: "inline-block" }}>
      <AntdUpload {...props} style={{ ...styles, pointerEvents: "none" }}>
        <Button icon={<UploadOutlined />}>Click to Upload</Button>
      </AntdUpload>
    </div>
  );
};

export default UploadDev;
