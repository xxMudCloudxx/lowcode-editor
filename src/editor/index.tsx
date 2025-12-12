import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spin } from "antd";
import { Header } from "./components/Header/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { Preview } from "./components/Preview";
import { useShortcutKeys } from "./hooks/useShortcutKeys";
import { useCollaboration } from "./hooks/useCollaboration";
import { useLivePageLoader } from "./hooks/useLivePageLoader";
import { useUIStore } from "./stores/uiStore";
import {
  useCollaborationStore,
  type EditorMode,
} from "./stores/collaborationStore";

interface Props {
  mode: EditorMode;
}

export default function ReactPlayground({ mode: editorMode }: Props) {
  const uiMode = useUIStore((s) => s.mode);
  const { pageId } = useParams<{ pageId: string }>();
  const {
    isPageLoading,
    editorMode: storeEditorMode,
    setEditorMode,
    setPageId,
  } = useCollaborationStore();

  // 同步 props 到 Zustand store（仅在 mount 和 props 变化时）
  useEffect(() => {
    setEditorMode(editorMode);
    setPageId(pageId || null);
  }, [editorMode, pageId, setEditorMode, setPageId]);

  // 这些 hooks 内部直接从 store 读取状态
  useShortcutKeys();
  useLivePageLoader();
  useCollaboration();

  // 联机模式加载中显示 Loading
  if (storeEditorMode === "live" && isPageLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <Spin size="large" tip="正在加载页面..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* 顶部导航栏 */}
      <div className="h-16 flex items-center bg-surface-elevated border-b border-border shadow-sm px-6">
        <Header />
      </div>

      {uiMode === "edit" ? (
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
              <div className="h-full bg-linear-to-br from-surface to-neutral-100">
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
