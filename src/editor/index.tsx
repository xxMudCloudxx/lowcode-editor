import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Header } from "./components/Header/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { Preview } from "./components/Preview";
import { useShortcutKeys } from "./hooks/useShortcutKeys";
import { useUIStore } from "./stores/uiStore";

export default function ReactPlayground() {
  const mode = useUIStore((s) => s.mode);
  useShortcutKeys();

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* 顶部导航栏 */}
      <div className="h-16 flex items-center bg-surface-elevated border-b border-border shadow-sm px-6">
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
              <div className="h-full bg-gradient-to-br from-surface to-neutral-100">
                <EditArea />
              </div>
            </Allotment.Pane>

            {/* 右侧设置面板 */}
            <Allotment.Pane preferredSize={360} maxSize={480} minSize={320}>
              <div className="h-full custom-panel border-l border-border">
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
