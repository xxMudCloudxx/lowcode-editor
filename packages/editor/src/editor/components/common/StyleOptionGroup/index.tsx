/**
 * @file /src/editor/components/common/StyleOptionGroup/index.tsx
 * @description
 * 一个通用的样式选项按钮组。它封装了 Ant Design 的 Button.Group 和 Form.Item，
 * 用于提供一组互斥的样式选项（如 display, float, text-align）。
 * 支持点击选中和再次点击取消的功能。
 * @module Components/Common/StyleOptionGroup
 */
import React from "react";
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
  children?: any;
}

/**
 * @description 一个通用的样式选项按钮组，封装了标签、按钮、提示和点击切换逻辑
 */
const StyleOptionGroup = ({
  label,
  options,
  currentValue,
  onChange,
  children,
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
      <div 
        style={{ 
          width: "100%", 
          display: "flex",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          overflow: "hidden"
        }}
      >
        {options.map((opt, index) => (
          <React.Fragment key={opt.value}>
            <Tooltip title={opt.tooltip}>
              <Button
                style={{ 
                  flex: 1, 
                  border: "none",
                  borderRadius: 0
                }}
                type={currentValue === opt.value ? "primary" : "default"}
                icon={opt.icon}
                onClick={() => handleClick(opt.value)}
                block
              >
                {opt.label}
              </Button>
            </Tooltip>
            {index < options.length - 1 && (
              <div 
                style={{
                  width: "1px",
                  backgroundColor: "#d9d9d9",
                  alignSelf: "stretch"
                }}
              />
            )}
           </React.Fragment>
        ))}
      </div>
      {children}
    </Form.Item>
  );
};
export default StyleOptionGroup;
