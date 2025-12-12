import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { createContext, useContext } from "react";
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

/**
 * @description 编辑器模式
 * - local: 本地模式，使用 LocalStorage
 * - live: 联机模式，使用 WebSocket 协同
 */
export type EditorMode = "local" | "live";

/**
 * @description 协同上下文，提供给子组件判断当前模式
 */
interface CollaborationContextValue {
  /** 编辑器运行模式 */
  editorMode: EditorMode;
  /** 当前页面 ID（联机模式下有值） */
  pageId: string | null;
  /** 是否为联机模式 */
  isLiveMode: boolean;
  /** WebSocket 是否已连接 */
  isConnected: boolean;
  /** 连接错误信息 */
  connectionError: string | null;
  /** 页面是否正在加载 */
  isPageLoading: boolean;
}

const CollaborationContext = createContext<CollaborationContextValue>({
  editorMode: "local",
  pageId: null,
  isLiveMode: false,
  isConnected: false,
  connectionError: null,
  isPageLoading: false,
});

/**
 * @description 获取协同上下文
 */
export function useCollaborationContext() {
  return useContext(CollaborationContext);
}

interface Props {
  mode: EditorMode;
}

export default function ReactPlayground({ mode: editorMode }: Props) {
  const uiMode = useUIStore((s) => s.mode);
  const { pageId } = useParams<{ pageId: string }>();

  // 联机模式下禁用 Undo/Redo 快捷键
  useShortcutKeys(editorMode === "live");

  // F-05: 联机模式从 API 加载页面数据
  const { isLoading: isPageLoading } = useLivePageLoader(
    editorMode === "live" ? pageId || null : null
  );

  // F-06: 建立 WebSocket 连接（仅联机模式）
  const { isConnected, connectionError } = useCollaboration(
    editorMode === "live" ? pageId || null : null
  );

  // 协同上下文值
  const collaborationValue: CollaborationContextValue = {
    editorMode,
    pageId: pageId || null,
    isLiveMode: editorMode === "live",
    isConnected,
    connectionError,
    isPageLoading,
  };

  // 联机模式加载中显示 Loading
  if (editorMode === "live" && isPageLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <Spin size="large" tip="正在加载页面..." />
      </div>
    );
  }

  return (
    <CollaborationContext.Provider value={collaborationValue}>
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
    </CollaborationContext.Provider>
  );
}
