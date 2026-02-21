/**
 * @file /src/editor/components/Setting/CssEditor.tsx
 * @description
 * 一个可复用的、基于 Monaco Editor 的 CSS 代码编辑器组件。
 * 该组件包含一个保存按钮，仅在内容被修改后激活。
 * @module Components/Setting/CssEditor
 */
import MonacoEditor, {
  type OnMount,
  type EditorProps,
} from "@monaco-editor/react";
import { Button } from "antd";
import { editor } from "monaco-editor";
import { useState } from "react";

export interface EditorFile {
  name: string;
  value: string;
  language: string;
}

interface Props {
  /** 外部传入的 CSS 初始值 */
  value: string;
  /** 点击保存按钮时的回调函数 */
  onSave?: (newValue: string) => void;
  /** Monaco Editor 的其他配置项 */
  options?: editor.IStandaloneEditorConstructionOptions;
}

export default function CssEditor(props: Props) {
  const { value, onSave, options } = props;

  /**
   * @description 内部状态，用于存储编辑器当前的内容。
   * 我们不直接修改父组件传来的 `value` prop，而是维护一个内部状态，
   * 这样可以自由编辑，只在保存时通知父组件。
   */
  const [internalValue, setInternalValue] = useState(value);

  /**
   * @description “脏”状态标记。
   * `true` 表示内容已被修改但未保存，`false` 表示内容是干净的（与传入的 `value` 一致）。
   */
  const [isDirty, setIsDirty] = useState(false);

  /**
   * @description 监听外部 `value` prop 的变化。
   * 当父组件通过某种方式（例如，从服务器加载新数据或保存成功后）更新了 `value` 时，
   * 我们需要同步更新编辑器的内部值，并重置“脏”状态。
   */
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInternalValue(value);
    setIsDirty(false);
  }

  /**
   * @description 编辑器挂载后的回调。
   */
  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  /**
   * @description 编辑器内容变化时的回调。
   * @param newValue 编辑器最新的内容
   */
  const handleEditorChange: EditorProps["onChange"] = (newValue) => {
    const newContent = newValue || "";
    setInternalValue(newContent);
    // 将新内容与父组件传入的原始 `value` 对比，判断是否“脏”了
    setIsDirty(newContent !== value);
  };

  /**
   * @description 点击保存按钮的事件处理函数。
   */
  const handleSave = () => {
    // 只有在 onSave 存在且内容已修改时才调用
    if (onSave && isDirty) {
      onSave(internalValue);
    }
  };

  return (
    // 1. 使用一个相对定位的容器来包裹编辑器和按钮
    <div className="h-full w-full flex flex-col">
      {/* 2. 保存按钮，使用绝对定位放置在右上角 */}
      <Button
        onClick={handleSave}
        // 3. 根据 isDirty 状态决定按钮是否禁用
        disabled={!isDirty}
        size="small"
      >
        保存
      </Button>

      <MonacoEditor
        height={"100%"}
        path="component.css"
        language="css"
        onMount={handleEditorMount}
        // 4. 编辑器的值绑定到内部状态 `internalValue`
        value={internalValue}
        // 5. 编辑器的 onChange 事件触发我们的状态更新逻辑
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          fixedOverflowWidgets: true,
          ...options,
        }}
      />
    </div>
  );
}
