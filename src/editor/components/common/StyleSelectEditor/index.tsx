// src/editor/components/common/StyleSelectEditor/index.tsx

import { Select } from "antd";
import type { CSSProperties } from "react";
import { useStyleChangeHandler } from "../../../hooks/useStyleChangeHandler";

interface StyleSelectEditorProps {
  label?: string;
  propertyName: keyof CSSProperties;
  options: { label: string; value: string }[];
  value?: CSSProperties;
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
