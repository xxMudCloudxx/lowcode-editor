import { Button, Form, Tooltip } from "antd";
import type { ReactNode } from "react";

interface StyleOption {
  value: string;
  tooltip: string;
  icon?: ReactNode;
  label?: string;
}
interface StyleOptionGroupProps {
  label?: string;
  options: StyleOption[];
  currentValue?: string;
  onChange: (newValue?: string) => void;
}

/**
 * @description 一个通用的样式选项按钮组，封装了标签、按钮、提示和点击切换逻辑
 */
const StyleOptionGroup = ({
  label,
  options,
  currentValue,
  onChange,
}: StyleOptionGroupProps) => {
  const handleClick = (clickedValue: string) => {
    if (currentValue === clickedValue) {
      onChange(undefined); // 再次点击则取消
    } else {
      onChange(clickedValue);
    }
  };
  const marginBottom = label ? 12 : 0;

  return (
    <Form.Item label={label} style={{ marginBottom }}>
      <Button.Group style={{ width: "100%", display: "flex" }}>
        {options.map((opt) => (
          <Tooltip title={opt.tooltip} key={opt.value}>
            <Button
              style={{ flex: 1 }}
              type={currentValue === opt.value ? "primary" : "default"}
              icon={opt.icon}
              onClick={() => handleClick(opt.value)}
            >
              {opt.label}
            </Button>
          </Tooltip>
        ))}
      </Button.Group>
    </Form.Item>
  );
};
export default StyleOptionGroup;
