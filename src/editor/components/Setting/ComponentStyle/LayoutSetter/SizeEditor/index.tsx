import { InputNumber } from "antd";
import { useEffect, useState, type CSSProperties } from "react";
import { addUnit, stripUnit } from "../../../../../utils/styles";

interface SizeEditorProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
  curComponentId: Number;
}
type SizeType = "width" | "height";

const SizeEditor = (props: SizeEditorProps) => {
  const { value = {}, onChange, curComponentId } = props;
  const [size, setSize] = useState<Record<SizeType, string>>({
    width: "",
    height: "",
  });

  useEffect(() => {
    if (!value) return;
    setSize({
      width: stripUnit(value.width),
      height: stripUnit(value.height),
    });
  }, [value]);

  const node = document.querySelector(
    `[data-component-id="${curComponentId}"]`
  );
  if (!node) {
    return;
  }
  const { width, height } = node.getBoundingClientRect();

  //   const ComponentDefaultWidth = curComponent.;
  const valChange = (type: SizeType) => {
    return (newValue: string | null) => {
      const v = newValue === null ? "" : newValue;
      if (/\d*/g.test(v)) {
        onChange?.({
          ...value,
          [type]: addUnit(v),
        });
      }
    };
  };
  return (
    <div className="flex flex-row items-center  mr-9">
      <InputNumber
        prefix="宽度"
        addonAfter="px"
        onChange={valChange("width")}
        value={size.width}
        placeholder={`${Math.round(width)}`}
        className="pr-6"
      />
      <InputNumber
        prefix="高度"
        addonAfter="px"
        onChange={valChange("height")}
        value={size.height}
        placeholder={`${Math.round(height)}`}
      />
    </div>
  );
};

export default SizeEditor;
