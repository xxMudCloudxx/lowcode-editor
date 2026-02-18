/**
 * @file /src/editor/components/common/LoadingPlaceholder/index.tsx
 * @description
 * 一个通用的、纯展示的加载占位组件。
 * 主要用于 React.lazy 和 Suspense 结合的场景，当懒加载的组件正在下载时，
 * 显示一个带有 Spin 指示器和加载文本的友好提示，以提升用户体验。
 * @module Components/Common/LoadingPlaceholder
 */
import { Spin } from "antd";

interface LoadingPlaceholderProps {
  /**
   * @description 要加载的组件的描述文本，例如 "按钮", "表格" 等。
   * 会显示在 Spin 指示器旁边。
   */
  componentDesc: string;
}

/**
 * @description 一个简单的加载占位组件。
 * @param {LoadingPlaceholderProps} props - 组件的 props。
 * @returns {React.ReactElement}
 */
const LoadingPlaceholder = ({
  componentDesc,
}: LoadingPlaceholderProps): React.ReactElement => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "100px", // 给一个最小高度，避免在加载时区域塌陷
        background: "rgba(0, 0, 0, 0.02)",
        border: "1px dashed #ccc",
        color: "#999",
        boxSizing: "border-box",
      }}
    >
      <Spin />
      <span style={{ marginLeft: 8 }}>正在加载 {componentDesc}...</span>
    </div>
  );
};

export default LoadingPlaceholder;
