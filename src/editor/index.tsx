import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Header } from "./components/Header/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { useComponetsStore } from "./stores/components";
import { Preview } from "./components/Preview";
import { useEffect, useMemo } from "react";
import { message } from "antd";
import { useStore } from "zustand";
import { debounce } from "lodash-es";

export default function ReactPlayground() {
  const {
    mode,
    curComponentId,
    curComponent,
    components,
    copyComponents,
    pasteComponents,
    deleteComponent,
  } = useComponetsStore();

  const ContainerList: Set<string> = new Set([
    "Container",
    "Page",
    "Modal",
    "Table",
  ]);
  // 从 temporal store 中多获取一个 clear 方法
  const { undo, redo, pastStates, futureStates } = useStore(
    useComponetsStore.temporal
  );

  // 防抖版本的message函数
  const debouncedMessage = useMemo(
    () =>
      debounce((text: string) => {
        message.success(text);
      }, 300),
    []
  );
  // 添加 useEffect 来处理快捷键
  useEffect(() => {
    /**
     * @description 全局键盘事件处理器
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // --- 关键：防止在输入框中触发快捷键 ---
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // --- 判断并执行快捷键 ---
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      switch (e.key.toLowerCase()) {
        // 复制：Cmd/Ctrl + C
        case "c":
          if (isCmdOrCtrl && curComponentId) {
            e.preventDefault();
            copyComponents(curComponentId);
            debouncedMessage("复制成功");
          }
          break;

        // 粘贴：Cmd/Ctrl + V
        case "v":
          if (isCmdOrCtrl && curComponentId) {
            e.preventDefault();
            if (!curComponent) return;

            // 智能判断粘贴目标：
            // 如果当前选中是容器，就粘贴到容器内部
            // 否则，粘贴到当前组件的父级中（成为其兄弟节点）
            const parentId = ContainerList.has(curComponent.name)
              ? curComponentId
              : curComponent.parentId;

            if (parentId) {
              if (parentId === curComponentId) console.log("");
              pasteComponents(parentId);
            }

            debouncedMessage("粘贴成功");
          }
          break;

        // 撤销：Cmd/Ctrl + Z
        // 重做：Cmd/Ctrl + Shift + Z
        case "Z":
          if (isCmdOrCtrl && pastStates.length > 0) {
            undo();
            debouncedMessage("撤销成功");
          } else if (isCmdOrCtrl && isShift && futureStates.length > 0) {
            redo();
            debouncedMessage("重做成功");
          }
          break;

        // 删除：Delete 或 Backspace
        case "delete":
        case "backspace":
          if (curComponentId && curComponentId !== 1) {
            // 根 Page 组件不允许删除
            e.preventDefault();
            deleteComponent(curComponentId);
          }
          break;

        default:
          break;
      }
    };

    // 挂载事件监听器
    window.addEventListener("keydown", handleKeyDown);

    // 关键：组件卸载时，必须移除监听器
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };

    // 依赖项数组：确保 handleKeyDown 总能获取到最新的 state 和 actions
  }, [
    curComponentId,
    components,
    copyComponents,
    pasteComponents,
    deleteComponent,
  ]);

  return (
    <div className="h-[100vh] flex flex-col">
      <div className=" h-[60px] flex items-center border-b-[1px] border-[#000]">
        <Header />
      </div>
      {mode === "edit" ? (
        <Allotment>
          <Allotment.Pane preferredSize={240} minSize={200}>
            <MaterialWrapper />
          </Allotment.Pane>
          <Allotment.Pane>
            <EditArea />
          </Allotment.Pane>
          <Allotment.Pane preferredSize={300} maxSize={500} minSize={300}>
            <Setting />
          </Allotment.Pane>
        </Allotment>
      ) : (
        <Preview />
      )}
    </div>
  );
}
