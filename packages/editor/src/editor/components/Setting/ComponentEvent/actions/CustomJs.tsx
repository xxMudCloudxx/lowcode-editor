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

/**
 * 默认代码模板，帮助用户了解可用 API
 */
const DEFAULT_CODE_TEMPLATE = `// 可用 API:
// - ShowMessage("消息内容")  显示成功提示
// - context.name           当前组件名称
// - context.props          当前组件属性
// - args                   事件触发时的参数
`;

function ensureEditorTemplate(code?: string): string {
  if (!code || code.trim().length === 0) {
    return DEFAULT_CODE_TEMPLATE;
  }

  if (code.startsWith(DEFAULT_CODE_TEMPLATE)) {
    return code;
  }

  return `${DEFAULT_CODE_TEMPLATE}\n${code.trimStart()}`;
}

function resolveEditorValue(
  value?: string,
  defaultValue?: string,
): string {
  return ensureEditorTemplate(value || defaultValue);
}

function stripDefaultTemplateComments(code: string): string {
  if (!code.startsWith(DEFAULT_CODE_TEMPLATE)) {
    return code;
  }

  return code.slice(DEFAULT_CODE_TEMPLATE.length).replace(/^\s+/, "");
}

export function CustomJS(props: CustomJsProps) {
  const { value: val, defaultValue, onChange } = props;
  const curComponentId = useUIStore((s) => s.curComponentId);
  const [value, setValue] = useState(resolveEditorValue(val, defaultValue));

  useEffect(() => {
    setValue(resolveEditorValue(val, defaultValue));
  }, [defaultValue, val]);

  function codeChange(value?: string) {
    if (!curComponentId) return;

    const nextValue = value || "";
    setValue(nextValue);

    onChange?.({
      type: "customJs",
      code: stripDefaultTemplateComments(nextValue),
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
            path={`action-${curComponentId ?? "new"}.js`}
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
        <div className="text-xs text-gray-500 space-y-1">
          <p>快捷键：Ctrl+J (Windows) / Cmd+J (Mac) 格式化代码</p>
        </div>
      </div>
    </div>
  );
}
