import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import {
  useComponentsStore,
  buildComponentTree,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import { useEffect, useMemo, useState } from "react";
import { Button, message, Tooltip, Upload, type UploadProps } from "antd";
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ComponentTree } from "../../../interface";

export function Source() {
  // 从 Components Store 中获取组件数据和更新方法
  const { components, rootId, setComponents } = useComponentsStore();
  const { setCurComponentId } = useUIStore();

  // 将范式化 Map 转换为树状结构，方便编辑和导入导出
  const treeData = useMemo<ComponentTree[]>(
    () => buildComponentTree(components, rootId),
    [components, rootId]
  );

  // stringified 后的 JSON 缓存，用于“脏”状态比对
  const originalCode = JSON.stringify(treeData, null, 2);

  // 编辑器内部维护一份自己的状态，不直接与 store 耦合
  const [internalCode, setInternalCode] = useState(originalCode);
  // “脏”状态标记，用于控制“保存”按钮的可用性
  const [isDirty, setIsDirty] = useState(false);
  // 全屏状态标记
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 监听来自 store 的外部变化（如拖拽、撤销/重做），同步更新编辑器内容
  useEffect(() => {
    const newOriginalCode = JSON.stringify(treeData, null, 2);
    setInternalCode(newOriginalCode);
    setIsDirty(false);
  }, [treeData]);

  // 编辑器事件处理
  const handleEditorMount: OnMount = (editor, monaco) => {
    // 绑定快捷键 Ctrl/Cmd + J 进行代码格式化
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });

    // 当用户点击编辑器使其获得焦点时，清空画布中的当前选中组件
    editor.onDidFocusEditorText(() => {
      setCurComponentId(null);
    });
  };

  const handleEditorChange = (value?: string) => {
    const newCode = value || "";
    setInternalCode(newCode);
    setIsDirty(newCode !== originalCode);
  };

  /**
   * 保存源码修改
   */
  const handleSave = () => {
    try {
      const newComponents = JSON.parse(internalCode);
      setComponents(newComponents);
      message.success("源码已保存！");
    } catch (error) {
      console.error("解析源码失败:", error);
      message.error("源码格式错误，请检查 JSON 格式！");
    }
  };

  /**
   * 导出 Schema 为 JSON 文件
   */
  const handleExport = () => {
    try {
      const content = JSON.stringify(treeData, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = dayjs();
      const formattedString = now.format("YY年MM月DD日HH时mm分ss秒");
      const a = document.createElement("a");
      a.href = url;
      a.download = `lowcode-schema-${formattedString}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("Schema 导出成功！");
    } catch (error) {
      message.error("导出失败");
      console.error("导出 Schema 失败:", error);
    }
  };

  /**
   * 导入 Schema 文件
   */
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error("文件内容为空");
        }
        const newComponents = JSON.parse(content);
        if (Array.isArray(newComponents)) {
          setComponents(newComponents);
          message.success("Schema 导入成功！");
        } else {
          throw new Error("非法的 Schema 格式");
        }
      } catch (error) {
        console.error("解析 Schema 失败:", error);
        message.error("导入失败：文件格式错误或内容无效");
      }
    };
    reader.onerror = () => {
      message.error("读取文件失败");
    };
    reader.readAsText(file);
    return false; // 阻止 antd Upload 的默认上传行为
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setCurComponentId(null);
  };

  const editorWrapperClass = isFullscreen
    ? "fixed top-0 left-0 w-screen h-screen z-50 bg-white flex flex-col p-4"
    : "relative h-full w-full flex flex-col";

  const uploadProps: UploadProps = {
    accept: ".json",
    showUploadList: false,
    beforeUpload: handleImport,
  };

  return (
    <div
      className={editorWrapperClass}
      onClick={() => {
        setCurComponentId(null);
      }}
    >
      {/* 顶部操作栏 */}
      <div className="flex justify-end items-center mb-2 flex-shrink-0">
        <div className="flex-1">
          {isDirty && (
            <span className="text-yellow-600 text-xs ml-2">
              检测到未保存的更改
            </span>
          )}
        </div>
        <Button onClick={handleSave} disabled={!isDirty} type="primary">
          保存
        </Button>
        {/* 导出按钮 */}
        <Tooltip title="导出 Schema">
          <Button icon={<UploadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Tooltip>

        {/* 导入按钮 (使用 Upload 组件包装) */}
        <Upload {...uploadProps}>
          <Tooltip title="导入 Schema (将覆盖当前画布)">
            <Button
              icon={<DownloadOutlined />}
              onClick={(e) => e.preventDefault()}
            >
              导入
            </Button>
          </Tooltip>
        </Upload>
        <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
          <Button
            icon={
              isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
            }
            onClick={toggleFullscreen}
            className="mr-2"
          />
        </Tooltip>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%" // 关键：确保编辑器高度占满其容器
          path="components.json"
          language="json"
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          value={internalCode}
          options={{
            fontSize: 14,
            scrollBeyondLastLine: false,
            minimap: {
              enabled: false,
            },
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
}

