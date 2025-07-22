/**
 * @file /src/editor/components/Setting/CssEditor.tsx
 * @description
 * 一个可复用的、基于 Monaco Editor 的 CSS 代码编辑器组件。
 * 预设了部分常用的编辑器配置。
 * @module Components/Setting/CssEditor
 */
import MonacoEditor, {
  type OnMount,
  type EditorProps,
} from "@monaco-editor/react";
import { editor } from "monaco-editor";

export interface EditorFile {
  name: string;
  value: string;
  language: string;
}

interface Props {
  value: string;
  onChange?: EditorProps["onChange"];
  options?: editor.IStandaloneEditorConstructionOptions;
}

export default function CssEditor(props: Props) {
  /**
   * @description 编辑器挂载后的回调。
   * 这里可以添加自定义命令、配置等。
   */
  const { value, onChange, options } = props;

  const handleEditorMount: OnMount = (editor, monaco) => {
    // 示例：添加一个快捷键 (Cmd/Ctrl + J) 来格式化代码
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  return (
    <MonacoEditor
      height={"100%"}
      path="component.css"
      language="css"
      onMount={handleEditorMount}
      onChange={onChange}
      value={value}
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
        fixedOverflowWidgets: true,
        // 合并传入的 options，允许外部自定义
        ...options,
      }}
    />
  );
}
