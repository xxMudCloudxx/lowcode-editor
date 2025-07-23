// src/editor/components/common/StyleSelectEditor/index.tsx

import { Form, Select } from "antd";
import type { CSSProperties } from "react";

interface StyleSelectEditorProps {
  label: string;
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
  const handleChange = (newValue?: string) => {
    onChange?.({
      [propertyName]: newValue,
    });
  };

  return (
    <Form.Item label={label} style={{ marginBottom: 12 }}>
      <Select
        style={{ width: "100%" }}
        allowClear // 允许用户清除选择
        placeholder={`选择${label}`}
        options={options}
        value={value[propertyName] as string}
        onChange={handleChange}
      />
    </Form.Item>
  );
};

export default StyleSelectEditor;
