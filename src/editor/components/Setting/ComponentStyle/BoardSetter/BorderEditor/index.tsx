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

// 定义组件接收的 props
interface BorderRadiusEditorProps {
  value: KebabCaseCSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const BorderEditor = (props: BorderRadiusEditorProps) => {
  const { value = {}, onChange } = props;
  const camelCaseValue = useMemo(() => convertKeysToCamelCase(value), [value]);

  const [localType, setLocalType] = useState("");

  const debugg = (v: any) => {
    debugger;
    onChange?.(v);
  };

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
            value={camelCaseValue}
            propertyName={`${localType}Color` as keyof CSSProperties}
            onChange={onChange}
            className="mb-2"
          />
          <StyleSelectEditor
            value={camelCaseValue}
            propertyName={`${localType}Style` as keyof CSSProperties}
            options={borderTypeOptions}
            onChange={debugg}
            label="样式"
          />
        </div>
      )}
    </div>
  );
};

export default BorderEditor;
