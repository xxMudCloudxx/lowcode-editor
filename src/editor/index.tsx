import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Header } from "./components/Header/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { useComponetsStore } from "./stores/components";
import { Preview } from "./components/Preview";
import { useShortcutKeys } from "./hooks/useShortcutKeys";

export default function ReactPlayground() {
  const { mode } = useComponetsStore();

  useShortcutKeys();

  return (
    <div className="h-[100vh] flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="h-[64px] flex items-center bg-white border-b border-gray-200 shadow-sm px-6">
        <Header />
      </div>
      
      {mode === "edit" ? (
        <div className="flex-1 flex overflow-hidden">
          <Allotment>
            {/* 左侧物料面板 */}
            <Allotment.Pane preferredSize={280} minSize={240}>
              <div className="h-full custom-panel">
                <div className="p-4">
                  <MaterialWrapper />
                </div>
              </div>
            </Allotment.Pane>
            
            {/* 中间编辑区域 */}
            <Allotment.Pane>
              <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100">
                <EditArea />
              </div>
            </Allotment.Pane>
            
            {/* 右侧设置面板 */}
            <Allotment.Pane preferredSize={360} maxSize={480} minSize={320}>
              <div className="h-full custom-panel border-l border-gray-200">
                <div className="p-4">
                  <Setting />
                </div>
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Preview />
        </div>
      )}
    </div>
  );
}
