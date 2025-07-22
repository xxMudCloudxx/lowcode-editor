import { InputNumber, Space } from "antd";
import { useEffect, useState, type CSSProperties } from "react";
import { addUnit, stripUnit } from "../../../utils/styles";

// 定义传入的属性对的类型
interface PairedProperty {
  label: string;
  propertyName: keyof CSSProperties;
  placeholder?: string;
}

interface PairedInputEditorProps {
  // 传入的完整样式对象
  value?: CSSProperties;
  // 更新样式的回调函数
  onChange?: (css: CSSProperties) => void;
  // 定义第一个输入框
  prop1: PairedProperty;
  // 定义第二个输入框
  prop2: PairedProperty;
  // 通用单位
  unit?: string;
}

const PairedInputEditor = ({
  value = {},
  onChange,
  prop1,
  prop2,
  unit,
}: PairedInputEditorProps) => {
  if (!unit) unit = "px";
  const [internalValue1, setInternalValue1] = useState("");
  const [internalValue2, setInternalValue2] = useState("");

  // 当外部 value 变化时，同步到内部 state
  useEffect(() => {
    setInternalValue1(stripUnit(unit!, value[prop1.propertyName]));
    setInternalValue2(stripUnit(unit!, value[prop2.propertyName]));
  }, [value, prop1.propertyName, prop2.propertyName]);

  // 创建一个通用的 change 处理器
  const handleChange = (
    propertyName: keyof CSSProperties,
    newValue: string | null
  ) => {
    const v = newValue === null ? "" : newValue;
    if (/\d*/g.test(v)) {
      onChange?.({
        ...value,
        [propertyName]: addUnit(unit!, v),
      });
    }
  };

  return (
    <div className="flex flex-row justify-center items-center px-4">
      <Space>
        <InputNumber
          prefix={prop1.label}
          addonAfter={unit}
          value={internalValue1}
          placeholder={prop1.placeholder}
          onChange={(val) => handleChange(prop1.propertyName, val)}
          style={{ width: 120 }}
          controls={false}
        />
        <InputNumber
          prefix={prop2.label}
          addonAfter={unit}
          value={internalValue2}
          placeholder={prop2.placeholder}
          onChange={(val) => handleChange(prop2.propertyName, val)}
          style={{ width: 120 }}
          controls={false}
        />
      </Space>
    </div>
  );
};

export default PairedInputEditor;
