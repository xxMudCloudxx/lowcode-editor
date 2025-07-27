/**
 * @file /src/editor/components/Setting/ComponentStyle/BoardSetter/BorderEditor/index.tsx
 * @description
 * “样式”设置面板中的“边框”属性编辑器。
 * 该组件提供了一个可视化的界面，允许用户选择要编辑的边框（上、下、左、右或全部），
 * 并为其设置宽度、颜色和样式。
 * @module Components/Setting/ComponentStyle/BorderEditor
 */
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import {
  convertKeysToCamelCase,
  type KebabCaseCSSProperties,
} from "../../../../../utils/styles";
import { BorderControls } from "./BorderGlyphButton";
import { InputNumber } from "antd";
import StyleColorPicker from "../../../../common/StyleColorPicker";
import StyleSelectEditor from "../../../../common/StyleSelectEditor";
import { borderTypeOptions } from "./config";
import { useStyleChangeHandler } from "../../../../../hooks/useStyleChangeHandler";

// 定义组件接收的 props
interface BorderRadiusEditorProps {
  value: KebabCaseCSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const BorderEditor = (props: BorderRadiusEditorProps) => {
  const { value = {}, onChange } = props;
  const camelCaseValue = useMemo(() => convertKeysToCamelCase(value), [value]);

  const createChangeHandler = useStyleChangeHandler(onChange);
  const [localType, setLocalType] = useState("");

  const handleButtonClick = useCallback(
    (v?: string) => {
      const nextMode = v === localType ? "" : v || "";
      setLocalType(nextMode);
      console.log(nextMode);
    },
    [onChange, localType]
  );

  const handleWidthChange = (newV: number | null) => {
    if (localType) {
      onChange?.({
        [`${localType}Width`]: newV ? `${newV}px` : undefined,
      });
    }
  };

  return (
    <div className="flex flex-row">
      <BorderControls activeKey={localType} onButtonClick={handleButtonClick} />
      {localType !== "" && (
        <div className="flex flex-col ml-2">
          <InputNumber
            addonAfter="px"
            value={parseInt(value[`${localType}Width`] as string) || undefined}
            onChange={handleWidthChange}
            className="mb-2"
          />
          <StyleColorPicker
            value={camelCaseValue[`${localType}Color`]}
            onChange={createChangeHandler(
              `${localType}Color` as keyof CSSProperties
            )}
            className="mb-2"
          />
          <StyleSelectEditor
            value={camelCaseValue}
            propertyName={`${localType}Style` as keyof CSSProperties}
            options={borderTypeOptions}
            onChange={onChange}
            label="样式"
          />
        </div>
      )}
    </div>
  );
};

export default BorderEditor;
