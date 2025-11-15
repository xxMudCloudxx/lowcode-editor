import { useEffect, useState } from "react";
import { useUIStore } from "../../../../stores/uiStore";
import type { OnMount } from "@monaco-editor/react";
import MonacoEditor from "@monaco-editor/react";
export interface CustomJsConfig {
  type: "customJs";
  code: string;
}

export interface CustomJsProps {
  value?: string;
  defaultValue?: string;
  onChange?: (config: CustomJsConfig) => void;
}

export function CustomJS(props: CustomJsProps) {
  const { value: val, defaultValue, onChange } = props;
  const curComponentId = useUIStore((s) => s.curComponentId);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(val);
  }, [val]);

  function codeChange(value?: string) {
    if (!curComponentId) return;

    setValue(value);

    onChange?.({
      type: "customJs",
      code: value!,
    });
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          自定义 JavaScript 代码
        </label>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <MonacoEditor
            width={"100%"}
            height={"300px"}
            path="action.js"
            language="javascript"
            onMount={handleEditorMount}
            onChange={codeChange}
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
              padding: {
                top: 12,
                bottom: 12,
              },
              lineNumbers: "on",
              roundedSelection: false,
              automaticLayout: true,
            }}
          />
        </div>
        <p className="text-xs text-gray-500">
          提示：使用 Ctrl+J (Windows) 或 Cmd+J (Mac) 格式化代码
        </p>
      </div>
    </div>
  );
}
