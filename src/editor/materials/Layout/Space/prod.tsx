import { Space as AntdSpace } from "antd";
import type { CommonComponentProps } from "../../../interface";

/**
 * @description Space 组件的“生产”版本，用于预览和最终渲染。
 */
const SpaceProd = ({
  id,
  children,
  styles,
  ...props
}: CommonComponentProps) => {
  return (
    <AntdSpace {...props} id={String(id)} style={styles}>
      {children}
    </AntdSpace>
  );
};

export default SpaceProd;
