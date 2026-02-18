import { Input } from "antd";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    // 只有在 value 实际存在时才进行格式化
    if (value !== undefined) {
      try {
        const formattedJson = JSON.stringify(value, null, 2);
        setStr(formattedJson);
        setIsValid(true);
      } catch (e) {
        setStr("无效的 JSON 数据");
        setIsValid(false);
      }
    } else {
      // 如果外部没有传入 value，则显示为空
      setStr("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newStr = e.target.value;
    setStr(newStr);

    try {
      const parsed = JSON.parse(newStr);
      // 关键改动 2：在调用 onChange 之前，进行可选链 '?.' 调用
      onChange?.(parsed);
      setIsValid(true);
    } catch (e) {
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
