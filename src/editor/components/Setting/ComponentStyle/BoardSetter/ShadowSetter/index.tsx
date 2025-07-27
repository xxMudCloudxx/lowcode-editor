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

const shadowOptions = [
  { value: "outset", tooltip: "外阴影", label: "外阴影" },
  { value: "inset", tooltip: "内阴影", label: "内阴影" },
];

const DEFAULT_SHADOW: Shadow = {
  inset: false,
  offsetX: "0",
  offsetY: "0",
  blurRadius: "0",
  spreadRadius: "0",
  color: "#000000",
};

interface ShadowSetterProps {
  value?: CSSProperties;
  onChange?: (css: CSSProperties) => void;
}

const ShadowSetter = ({ value = {}, onChange }: ShadowSetterProps) => {
  const [shadow, setShadow] = useState<Shadow>(() =>
    parseBoxShadow(value.boxShadow)
  );

  const [activeShadowType, setActiveShadowType] = useState<
    "inset" | "outset" | undefined
  >(() => {
    if (!value.boxShadow || value.boxShadow === "none") return undefined;
    return value.boxShadow.includes("inset") ? "inset" : "outset";
  });

  useEffect(() => {
    const newShadow = parseBoxShadow(value.boxShadow);
    setShadow(newShadow);
    if (!value.boxShadow || value.boxShadow === "none") {
      setActiveShadowType(undefined);
    } else {
      setActiveShadowType(newShadow.inset ? "inset" : "outset");
    }
  }, [value.boxShadow]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((css: CSSProperties) => {
        onChange?.(css);
      }, 200),
    [onChange]
  );

  // 内外阴影按钮组的事件处理器
  const handleTypeChange = (type?: string) => {
    const newType = type as "inset" | "outset" | undefined;

    // 如果按钮被取消选中
    if (!newType) {
      setActiveShadowType(undefined);
      onChange?.({ boxShadow: undefined }); // 移除 box-shadow 属性
      return;
    }

    // 如果选中了新的按钮
    setActiveShadowType(newType);
    const isInset = newType === "inset";

    // 如果之前没有阴影，则应用默认阴影
    if (!activeShadowType) {
      const newBoxShadow = buildBoxShadow({
        ...DEFAULT_SHADOW,
        inset: isInset,
      });
      onChange?.({ boxShadow: newBoxShadow });
    } else {
      // 如果已有阴影，则只更新 inset 属性
      setShadow((prev) => {
        const newShadowState = { ...prev, inset: isInset };
        const newBoxShadow = buildBoxShadow(newShadowState);
        onChange?.({ boxShadow: newBoxShadow });
        return newShadowState;
      });
    }
  };

  // 用于更新单个阴影属性 (颜色, x, y 等) 的处理器
  const handleShadowPropertyChange = (
    key: keyof Shadow,
    val: string | number | boolean
  ) => {
    setShadow((prev) => {
      const newShadowState = { ...prev, [key]: val };
      // 此处会触发下面的 useEffect 来执行防抖更新
      debouncedOnChange({ boxShadow: buildBoxShadow(newShadowState) });
      return newShadowState;
    });
  };

  const style = "flex flex-row justify-center items-center";
  const width = { width: "100%" };

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <StyleOptionGroup
          options={shadowOptions}
          currentValue={activeShadowType}
          onChange={handleTypeChange}
        />
        {/* 只有在激活了阴影类型后，才显示详细设置 */}
        {activeShadowType && (
          <>
            <ColorPicker
              value={shadow.color}
              onChangeComplete={(c) =>
                handleShadowPropertyChange("color", c.toHexString())
              }
              style={{ width: "100%" }}
              showText
            />
            <Space>
              <InputNumber
                suffix="px"
                value={Number(shadow.offsetX)}
                onChange={(v) => handleShadowPropertyChange("offsetX", v ?? 0)}
                className={style}
                style={width}
              />
              <InputNumber
                suffix="px"
                value={Number(shadow.offsetY)}
                onChange={(v) => handleShadowPropertyChange("offsetY", v ?? 0)}
                className={style}
                style={width}
              />
            </Space>
            <Space>
              <InputNumber
                prefix="模糊"
                suffix="px"
                value={Number(shadow.blurRadius)}
                onChange={(v) =>
                  handleShadowPropertyChange("blurRadius", v ?? 0)
                }
                className={style}
                style={width}
              />
              <InputNumber
                prefix="扩展"
                suffix="px"
                value={Number(shadow.spreadRadius)}
                onChange={(v) =>
                  handleShadowPropertyChange("spreadRadius", v ?? 0)
                }
                className={style}
                style={width}
              />
            </Space>
          </>
        )}
      </Space>
    </div>
  );
};
export default ShadowSetter;
