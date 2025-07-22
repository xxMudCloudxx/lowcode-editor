import type { CSSProperties } from "react";
import PairedInputEditor from "../../../../common/PariedInputEditor";

interface SizeEditorProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
  curComponentId: Number;
}

const SizeEditor = (props: SizeEditorProps) => {
  const { value = {}, onChange, curComponentId } = props;

  // 获取 DOM 节点用于 placeholder
  const node = document.querySelector(
    `[data-component-id="${curComponentId}"]`
  );
  if (!node) {
    return null;
  }
  const { width, height } = node.getBoundingClientRect();

  return (
    <PairedInputEditor
      value={value}
      onChange={onChange}
      unit="px"
      prop1={{
        label: "宽度",
        propertyName: "width",
        placeholder: `${Math.round(width)}`,
      }}
      prop2={{
        label: "高度",
        propertyName: "height",
        placeholder: `${Math.round(height)}`,
      }}
    />
  );
};

export default SizeEditor;
