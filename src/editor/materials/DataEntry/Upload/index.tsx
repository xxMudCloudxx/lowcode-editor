/**
 * @file Upload/index.tsx
 * @description 纯净的 Upload 物料组件
 */
import { forwardRef } from "react";
import { Upload as AntdUpload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { MaterialProps } from "../../interface";

const Upload = forwardRef<HTMLDivElement, MaterialProps>(
  ({ style, className, "data-component-id": id, ...restProps }, ref) => {
    return (
      <div
        ref={ref}
        data-component-id={id}
        style={{ display: "inline-block", ...style }}
        className={className}
      >
        <AntdUpload {...restProps}>
          <Button icon={<UploadOutlined />}>点击上传</Button>
        </AntdUpload>
      </div>
    );
  }
);

Upload.displayName = "Upload";
export default Upload;
