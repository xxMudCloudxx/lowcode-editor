import type { CSSProperties, ReactNode } from "react";
import { Form, Button, Tooltip } from "antd";
import { layoutSettings } from "./config";
// --- 通用组件和类型定义 ---

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

  return (
    <Form.Item label={label} style={{ marginBottom: 12 }}>
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

// --- 主组件 ---

interface LayoutModalProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const LayoutModal = ({ value, onChange }: LayoutModalProps) => {
  const displayValue = value?.display;

  const createChangeHandler = (key: keyof CSSProperties) => {
    return (newValue?: string) => {
      onChange?.({ [key]: newValue });
    };
  };

  return (
    <div className="mr-6">
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} labelAlign="right">
        <StyleOptionGroup
          label="布局模式"
          options={layoutSettings.display}
          currentValue={displayValue}
          onChange={createChangeHandler("display")}
        />

        {/* 条件渲染 Flex 布局的专属设置 */}
        {displayValue === "flex" && (
          <div className="">
            <StyleOptionGroup
              label="主轴方向"
              options={layoutSettings.flexDirection}
              currentValue={value?.flexDirection}
              onChange={createChangeHandler("flexDirection")}
            />
            <StyleOptionGroup
              label="主轴对齐"
              options={layoutSettings.justifyContent}
              currentValue={value?.justifyContent}
              onChange={createChangeHandler("justifyContent")}
            />
            <StyleOptionGroup
              label="辅轴对齐"
              options={layoutSettings.alignItems}
              currentValue={value?.alignItems}
              onChange={createChangeHandler("alignItems")}
            />
            <StyleOptionGroup
              label={"换\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0行"}
              options={layoutSettings.flexWrap}
              currentValue={value?.flexWrap}
              onChange={createChangeHandler("flexWrap")}
            />
          </div>
        )}
      </Form>
    </div>
  );
};

export default LayoutModal;
