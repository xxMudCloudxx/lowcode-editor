import type { CSSProperties } from "react";
import { useEffect, useState, useMemo } from "react";
import { ColorPicker, InputNumber, Space } from "antd";
import { debounce } from "lodash-es";
import {
  buildBoxShadow,
  parseBoxShadow,
  type Shadow,
} from "../../../../../utils/styles";
import StyleOptionGroup from "../../../../common/StyleOptionGroup";

// 按钮配置
const shadowOptions = [
  { value: "outset", tooltip: "外阴影", label: "外阴影" },
  { value: "inset", tooltip: "内阴影", label: "内阴影" },
];

interface ShadowSetterProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const ShadowSetter = ({ value = {}, onChange }: ShadowSetterProps) => {
  const [shadow, setShadow] = useState<Shadow>(() =>
    parseBoxShadow(value.boxShadow)
  );

  useEffect(() => {
    setShadow(parseBoxShadow(value.boxShadow));
  }, [value.boxShadow]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((newShadow: Shadow) => {
        const boxShadow = buildBoxShadow(newShadow);
        if (boxShadow !== value.boxShadow) {
          onChange?.({ boxShadow });
        }
      }, 200),
    [onChange, value.boxShadow]
  );

  useEffect(() => {
    debouncedOnChange(shadow);
    return () => debouncedOnChange.cancel();
  }, [shadow, debouncedOnChange]);

  const handleValueChange = (
    key: keyof Shadow,
    val: string | number | boolean
  ) => {
    setShadow((prev) => ({ ...prev, [key]: val }));
  };

  const style = "flex flex-row justify-center items-center";
  const width = { width: "100%" };
  return (
    <div>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <StyleOptionGroup
          options={shadowOptions}
          currentValue={shadow.inset ? "inset" : "outset"}
          onChange={(type) => handleValueChange("inset", type === "inset")}
        />
        <ColorPicker
          value={shadow.color}
          onChangeComplete={(c) => handleValueChange("color", c.toHexString())}
          style={{ width: "100%" }}
          showText
        />
        <Space>
          <InputNumber
            suffix="px"
            value={Number(shadow.offsetX)}
            onChange={(v) => handleValueChange("offsetX", v ?? 0)}
            className={style}
            style={width}
          />
          <InputNumber
            suffix="px"
            value={Number(shadow.offsetY)}
            onChange={(v) => handleValueChange("offsetY", v ?? 0)}
            className={style}
            style={width}
          />
        </Space>
        <Space>
          <InputNumber
            prefix="模糊"
            suffix="px"
            value={Number(shadow.blurRadius)}
            onChange={(v) => handleValueChange("blurRadius", v ?? 0)}
            className={style}
            style={width}
          />
          <InputNumber
            prefix="扩展"
            suffix="px"
            value={Number(shadow.spreadRadius)}
            onChange={(v) => handleValueChange("spreadRadius", v ?? 0)}
            className={style}
            style={width}
          />
        </Space>
      </Space>
    </div>
  );
};
export default ShadowSetter;
