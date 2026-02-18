import { ConfigProvider } from "antd";
import { antdTheme } from "./theme/antdTheme";
import ReactPlayground from "./editor";

// 主入口
function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <ReactPlayground />
    </ConfigProvider>
  );
}

export default App;
