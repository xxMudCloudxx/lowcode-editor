import { Image as AntdImage } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const ImageDev = ({ id, name, styles, ...props }: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  return (
    <div ref={drag} data-component-id={id} style={{ display: "inline-block" }}>
      <AntdImage {...props} style={styles} preview={false} />
    </div>
  );
};

export default ImageDev;
