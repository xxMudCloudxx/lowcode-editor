/**
 * @file /src/editor/components/common/StyleSelectEditor/index.tsx
 * @description
 * 一个封装了 Ant Design Select 的受控组件，专门用于编辑离散值的 CSS 属性（如下拉选择）。
 * 它通过 `useStyleChangeHandler` Hook 来简化 onChange 逻辑。
 * @module Components/Common/StyleSelectEditor
 */
import { Select } from "antd";
import type { CSSProperties } from "react";
import { useStyleChangeHandler } from "../../../hooks/useStyleChangeHandler";

interface StyleSelectEditorProps {
  label?: string;
  /** 当前组件要绑定的 CSS 属性名，如 'fontWeight', 'fontFamily' */
  propertyName: keyof CSSProperties;
  /** antd Select 组件所需的 options 数组 */
  options: { label: string; value: string }[];
  /** 外部传入的完整样式对象 */
  value?: CSSProperties;
  /** 样式更新时的回调函数 */
  onChange?: (css: CSSProperties) => void;
}

const StyleSelectEditor = ({
  label,
  propertyName,
  options,
  value = {},
  onChange,
}: StyleSelectEditorProps) => {
  const handleChange = useStyleChangeHandler(onChange)(propertyName);

  return (
    <Select
      style={{ width: "100%" }}
      allowClear // 允许用户清除选择
      placeholder={`选择${label}`}
      options={options}
      value={value[propertyName] as string}
      onChange={handleChange}
    />
  );
};

export default StyleSelectEditor;
