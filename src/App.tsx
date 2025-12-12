import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { antdTheme } from "./theme/antdTheme";
import ReactPlayground from "./editor";

/**
 * @description 应用根组件
 * 配置路由：
 * - `/` 本地模式（LocalStorage）
 * - `/editor/:pageId` 联机模式（协同编辑）
 */
function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <Routes>
        {/* 本地模式：根路径 */}
        <Route path="/" element={<ReactPlayground mode="local" />} />
        {/* 联机模式：协同编辑 */}
        <Route
          path="/editor/:pageId"
          element={<ReactPlayground mode="live" />}
        />
        {/* 兜底重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default App;
