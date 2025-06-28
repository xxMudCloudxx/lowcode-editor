import { Spin } from "antd";

// 一个简单的加载占位组件
const LoadingPlaceholder = ({ componentDesc }: { componentDesc: string }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "100px", // 给一个最小高度，避免塌陷
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
