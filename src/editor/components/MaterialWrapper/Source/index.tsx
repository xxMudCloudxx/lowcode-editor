import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { useComponetsStore } from "../../../stores/components";
import { useEffect, useState } from "react";
import { Button, message, Tooltip, Upload, type UploadProps } from "antd";
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

export function Source() {
  // 1. 从 Zustand store 中获取组件数据和更新方法
  const { components, setComponents, setCurComponentId } = useComponetsStore();

  // 2. 状态管理
  // 将 stringified 后的 JSON 缓存，用于后续的“脏”状态比对
  const originalCode = JSON.stringify(components, null, 2);
  // 编辑器内部维护一份自己的状态，不直接与 store 耦合
  const [internalCode, setInternalCode] = useState(originalCode);
  // “脏”状态标记，用于控制“保存”按钮的可用性
  const [isDirty, setIsDirty] = useState(false);
  // 全屏状态标记
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 3. Effect: 监听来自 store 的外部变化
  // 当用户通过拖拽等方式修改了组件树（触发撤销/重做），这个 effect 会同步更新编辑器内容
  useEffect(() => {
    const newOriginalCode = JSON.stringify(components, null, 2);
    setInternalCode(newOriginalCode);
    // 外部更新后，重置“脏”状态
    setIsDirty(false);
  }, [components]); // 依赖项是原始 components 对象

  // 4. 编辑器事件处理
  const handleEditorMount: OnMount = (editor, monaco) => {
    // 绑定快捷键 Ctrl/Cmd + J 进行代码格式化
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });

    // 核心功能：当用户点击编辑器使其获得焦点时
    // 立即将画布中当前选中的组件ID设为 null
    // 这可以防止画布的 Ctrl+C/V (复制/粘贴组件) 快捷键与
    // 编辑器的文本复制/粘贴快捷键冲突
    editor.onDidFocusEditorText(() => {
      if (setCurComponentId) {
        setCurComponentId(null);
      }
    });
  };

  const handleEditorChange = (value?: string) => {
    const newCode = value || "";
    // 实时更新内部状态
    setInternalCode(newCode);
    // 实时检查是否与原始代码不同，更新“脏”状态
    setIsDirty(newCode !== originalCode);
  };

  /**
   * @description 保存 源码修改
   */
  const handleSave = () => {
    try {
      // 解析编辑器中的 JSON 字符串
      const newComponents = JSON.parse(internalCode);
      // 调用 store action，全量更新组件树
      setComponents(newComponents);
      message.success("源码已保存！");
    } catch (error) {
      console.error("解析源码失败:", error);
      message.error("源码格式错误，请检查 JSON 格式！");
    }
  };

  /**
   * @description 导出 Schema 为 JSON 文件
   */
  const handleExport = () => {
    try {
      const content = JSON.stringify(components, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      // 获取当前时间并格式化
      const now = dayjs();
      const formattedString = now.format("YY年MM月DD日HH时mm分ss秒");
      const a = document.createElement("a");
      a.href = url;
      a.download = `lowcode-schema-${formattedString}.json`; // 导出的文件名
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
   * @description 导入 Schema 文件
   */
  const handleImport = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error("文件内容为空");
        }
        const newComponents = JSON.parse(content);
        // 在这里可以添加更复杂的 Schema 验证逻辑
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
    if (setCurComponentId) {
      setCurComponentId(null);
    }
  };

  // 6. 动态样式与类名
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
            {/* 包裹一个额外的 Button 并阻止其默认点击事件，
                确保 Tooltip 和 Upload 的点击都能正确触发。
              */}
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
          value={internalCode} // 绑定到内部 state
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
