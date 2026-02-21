/**
 * @file /src/editor/components/Setting/ComponentStyle/LayoutSetter/SizeEditor/index.tsx
 * @description
 * 一个专门用于编辑组件尺寸（宽度和高度）的编辑器。
 * 它复用了 `PairedInputEditor` 组件，并智能地从 DOM 中获取当前组件的实际尺寸，
 * 将其作为 placeholder 显示，为用户提供参考。
 * @module Components/Setting/ComponentStyle/SizeEditor
 */
import type { CSSProperties } from "react";
import PairedInputEditor from "../../../../common/PariedInputEditor";
import { simulatorHost } from "@/editor/simulator";

interface SizeEditorProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
  curComponentId: number;
}

const SizeEditor = (props: SizeEditorProps) => {
  const { value = {}, onChange, curComponentId } = props;

  // 获取 iframe 内的 DOM 节点用于 placeholder
  const iframeDoc = simulatorHost.getIframeDocument();
  const node = iframeDoc?.querySelector(
    `[data-component-id="${curComponentId}"]`,
  );

  // 如果找到节点，则从实际尺寸中获取 placeholder
  let widthPlaceholder = "auto";
  let heightPlaceholder = "auto";

  if (node) {
    const { width, height } = node.getBoundingClientRect();
    widthPlaceholder = `${Math.round(width)}`;
    heightPlaceholder = `${Math.round(height)}`;
  }

  return (
    <PairedInputEditor
      value={value}
      onChange={onChange}
      unit="px"
      prop1={{
        label: "宽度",
        propertyName: "width",
        placeholder: widthPlaceholder,
      }}
      prop2={{
        label: "高度",
        propertyName: "height",
        placeholder: heightPlaceholder,
      }}
      unStyle={true}
    />
  );
};

export default SizeEditor;
