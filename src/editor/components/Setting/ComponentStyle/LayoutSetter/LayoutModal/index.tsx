import type { CSSProperties } from "react";
import { Form } from "antd";
import { layoutSettings } from "./config";
import StyleOptionGroup from "../../../../common/StyleOptionGroup";
import { useStyleChangeHandler } from "../../../../../hooks/useStyleChangeHandler";

interface LayoutModalProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const LayoutModal = ({ value, onChange }: LayoutModalProps) => {
  const displayValue = value?.display;

  const createChangeHandler = useStyleChangeHandler(onChange);

  return (
    <div className="ml-9">
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
