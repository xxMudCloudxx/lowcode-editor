import { Input } from "antd";
import { useState } from "react";

/**
 * @description 一个专门用于编辑 JSON 数据的受控组件，兼容 antd Form.Item。
 */
const JsonEditor = ({
  value,
  onChange,
  ...rest
}: {
  // 关键改动 1：将 value 和 onChange 标记为可选 '?'
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any; // 接收其他由 Form.Item 传入的属性
}) => {
  const [str, setStr] = useState("");
  const [isValid, setIsValid] = useState(true);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== undefined) {
      try {
        const formattedJson = JSON.stringify(value, null, 2);
        setStr(formattedJson);
        setIsValid(true);
      } catch (_e) {
        setStr("无效的 JSON 数据");
        setIsValid(false);
      }
    } else {
      setStr("");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newStr = e.target.value;
    setStr(newStr);

    try {
      const parsed = JSON.parse(newStr);
      // 关键改动 2：在调用 onChange 之前，进行可选链 '?.' 调用
      onChange?.(parsed);
      setIsValid(true);
    } catch (_e) {
      setIsValid(false);
    }
  };

  return (
    <Input.TextArea
      value={str}
      onChange={handleChange}
      autoSize={{ minRows: 3, maxRows: 10 }}
      style={{
        borderColor: isValid ? undefined : "red",
        fontFamily: "monospace",
      }}
      {...rest}
    />
  );
};

export default JsonEditor;
