/**
 * @file /src/editor/components/Setting/ComponentStyle/BoardSetter/BorderRadiusEditor/index.tsx
 * @description
 * “样式”设置面板中的“圆角” (border-radius) 编辑器。
 * 该组件允许用户以两种模式设置圆角：
 * 1. “统一设置”模式，通过一个滑块控制所有四个角的圆角。
 * 2. “分角设置”模式，为每个角提供独立的输入框。
 * @module Components/Setting/ComponentStyle/BorderRadiusEditor
 */
import { InputNumber } from "antd";
import { useState, type CSSProperties, useMemo, useCallback } from "react";
import StyleOptionGroup from "../../../../common/StyleOptionGroup";
import StyleSliderWithInput from "../../../../common/StyleSliderWithInput";
import {
  addUnit,
  convertKeysToCamelCase,
  stripUnit,
  type KebabCaseCSSProperties,
} from "../../../../../utils/styles";
import { BoardOptions, borderRadiusConfigs } from "./config";

// 定义组件接收的 props
interface BorderRadiusEditorProps {
  value?: KebabCaseCSSProperties;
  onChange?: (css: CSSProperties) => void;
  id?: number; // 当所选元素ID变化时，用于触发状态重置
}

// 辅助函数：重置所有分角圆角
const resetCornerRadii = (): CSSProperties => ({
  borderTopLeftRadius: undefined,
  borderTopRightRadius: undefined,
  borderBottomLeftRadius: undefined,
  borderBottomRightRadius: undefined,
});

// 辅助函数：从 CSS 对象中解析出分角圆角的数值
const parseCornerRadiiFromValue = (camelCaseValue: CSSProperties) => ({
  borderTopLeftRadius: stripUnit("px", camelCaseValue.borderTopLeftRadius),
  borderTopRightRadius: stripUnit("px", camelCaseValue.borderTopRightRadius),
  borderBottomLeftRadius: stripUnit(
    "px",
    camelCaseValue.borderBottomLeftRadius,
  ),
  borderBottomRightRadius: stripUnit(
    "px",
    camelCaseValue.borderBottomRightRadius,
  ),
});

// 辅助函数：将分角圆角对象转换回可用的 CSSProperties 对象
const applyCornerRadiiStyles = (
  corners: Record<string, string>,
): CSSProperties =>
  Object.fromEntries(
    Object.entries(corners).map(([key, val]) => [
      key,
      val ? addUnit("px", val) : undefined,
    ]),
  );

// 稳定的空对象引用，避免默认参数 `value = {}` 在每次渲染时创建新对象导致无限循环
const EMPTY_STYLES: KebabCaseCSSProperties = {};

const BorderRadiusEditor = ({
  value = EMPTY_STYLES,
  onChange,
  id,
}: BorderRadiusEditorProps) => {
  // 将外部传入的 kebab-case 风格的 CSS 转换为驼峰式，便于在 JS 中处理
  const camelCaseValue = useMemo(() => convertKeysToCamelCase(value), [value]);

  // 使用 state 来控制当前是“统一设置” (all) 还是“分角设置” (remote) 模式
  const [radioModal, setRadioModal] = useState<string>("");

  // 当外部数据源 (value) 或所选元素 (id) 变化时，同步UI模式（render-time sync）
  const [prevSyncKey, setPrevSyncKey] = useState({ camelCaseValue, id });
  if (camelCaseValue !== prevSyncKey.camelCaseValue || id !== prevSyncKey.id) {
    setPrevSyncKey({ camelCaseValue, id });
    const hasBorderRadius = camelCaseValue.borderRadius != null;
    const newRadii = parseCornerRadiiFromValue(camelCaseValue);
    const hasCornerValues = Object.values(newRadii).some(Boolean);

    if (hasBorderRadius) {
      setRadioModal("all");
    } else if (hasCornerValues) {
      setRadioModal("remote");
    }
  }

  // 回调函数：处理“统一圆角”模式的变更
  // 这个函数由 StyleSliderWithInput 在滑动结束后调用
  const handleAllRadiusChange = useCallback(
    (css: CSSProperties) => {
      // 准备好要提交的新的 CSS 对象
      const newCss: CSSProperties = {
        ...resetCornerRadii(), // 清除所有分角设置
        borderRadius: css.borderRadius || undefined,
      };
      onChange?.(newCss);
    },
    [onChange],
  );

  // 回调函数：处理“分角设置”模式的变更
  const handleCornerRadiusChange = useCallback(
    (key: keyof CSSProperties, newValue: number | null) => {
      const currentCorners = parseCornerRadiiFromValue(camelCaseValue);
      const newCorners = {
        ...currentCorners,
        [key]: newValue == null ? "" : String(newValue),
      };

      const hasAnyCorner = Object.values(newCorners).some(Boolean);

      const newCss: CSSProperties = {
        ...applyCornerRadiiStyles(newCorners),
        // 如果有任何一个分角值，就清除统一圆角设置
        borderRadius: hasAnyCorner ? undefined : "",
      };

      onChange?.(newCss);
    },
    [camelCaseValue, onChange],
  );

  // 回调函数：处理模式切换
  const handleModeChange = useCallback(
    (v?: string) => {
      const nextMode = v === radioModal ? "" : v || "";
      setRadioModal(nextMode);
    },
    [radioModal],
  );

  return (
    <StyleOptionGroup
      options={BoardOptions.radio}
      onChange={handleModeChange}
      currentValue={radioModal}
      label="圆角"
    >
      {radioModal === "all" && (
        <StyleSliderWithInput
          propertyName="borderRadius"
          value={camelCaseValue} // value 直接使用来自外部的权威数据
          onChange={handleAllRadiusChange} // onChange 连接到我们简化的回调
          min={0}
          max={100}
          step={1}
          unit="px"
        />
      )}
      {radioModal === "remote" && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {borderRadiusConfigs.map((config) => (
            <InputNumber
              key={config.key}
              value={Number(
                parseCornerRadiiFromValue(camelCaseValue)[
                  config.key as keyof ReturnType<
                    typeof parseCornerRadiiFromValue
                  >
                ] || 0,
              )}
              onChange={(val) =>
                handleCornerRadiusChange(config.key as keyof CSSProperties, val)
              }
              style={{ width: "100%" }}
              prefix={config.icon}
              suffix={"px"}
            />
          ))}
        </div>
      )}
    </StyleOptionGroup>
  );
};

export default BorderRadiusEditor;
