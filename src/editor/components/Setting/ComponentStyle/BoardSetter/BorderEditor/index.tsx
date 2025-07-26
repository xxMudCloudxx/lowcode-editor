import { useCallback, useMemo, useState, type CSSProperties } from "react";
import {
  addUnit,
  convertKeysToCamelCase,
  stripUnit,
  type KebabCaseCSSProperties,
} from "../../../../../utils/styles";
import { borderConfigs } from "./config";
import CustomIconButton from "../../../../common/CustomIconButton";
import { BorderBlockGlyph } from "../../../../common/BorderSideGlyph";

// 定义组件接收的 props
interface BorderRadiusEditorProps {
  value?: KebabCaseCSSProperties;
  onChange?: (css: CSSProperties) => void;
}
const parseBorderFromValue = (camelCaseValue: CSSProperties) => ({
  top: stripUnit("px", camelCaseValue.borderTop),
  right: stripUnit("px", camelCaseValue.borderRight),
  bottom: stripUnit("px", camelCaseValue.borderBottom),
  left: stripUnit("px", camelCaseValue.borderLeft),
  all: stripUnit("px", camelCaseValue.border),
});

// 辅助函数：将分角圆角对象转换回可用的 CSSProperties 对象
const applyBorderStyles = (corners: Record<string, string>): CSSProperties =>
  Object.fromEntries(
    Object.entries(corners).map(([key, val]) => [
      key,
      val ? addUnit("px", val) : undefined,
    ])
  );

const BorderEditor = (props: BorderRadiusEditorProps) => {
  const { value = {}, onChange } = props;
  const camelCaseValue = useMemo(() => convertKeysToCamelCase(value), [value]);

  const [localType, setLocalType] = useState("");

  const handleChange = useCallback(
    (key: keyof CSSProperties, newValue: number | null) => {
      const currentV = parseBorderFromValue(camelCaseValue);

      const newV = {
        ...currentV,
        [key]: newValue == null ? "" : String(newValue),
      };

      const newCSS: CSSProperties = {
        ...applyBorderStyles(newV),
      };

      onChange?.(newCSS);
    },
    [onChange]
  );

  const handleButtonClick = useCallback(
    (v?: string) => {
      const nextMode = v === localType ? "" : v || "";
      setLocalType(nextMode);
    },
    [onChange, localType]
  );

  const [topConfig, leftConfig, allConfig, rightConfig, bottomConfig] =
    borderConfigs;
  const middleRowConfigs = [leftConfig, allConfig, rightConfig];
  return (
    <div className="flex flex-col w-[100px] h-[100%] items-center justify-around">
      {/* 顶部按钮 */}
      <CustomIconButton
        key={topConfig.key}
        icon={
          <BorderBlockGlyph
            type={topConfig.type}
            active={localType === topConfig.key}
          />
        }
        // isActive={localType === topConfig.key}
        onClick={() => handleButtonClick(topConfig.key)}
        size={24}
      />

      {/* 中间行按钮：使用 map 动态渲染 */}
      <div className="flex flex-row items-center justify-center">
        {middleRowConfigs.map((config) => (
          <CustomIconButton
            key={config.key}
            icon={
              <BorderBlockGlyph
                type={config.type}
                active={localType === config.key}
              />
            }
            // isActive={localType === config.key}
            onClick={() => handleButtonClick(config.key)}
            size={24}
          />
        ))}
      </div>

      {/* 底部按钮 */}
      <CustomIconButton
        key={bottomConfig.key}
        icon={
          <BorderBlockGlyph
            type={bottomConfig.type}
            active={localType === bottomConfig.key}
          />
        }
        // isActive={localType === bottomConfig.key}
        onClick={() => handleButtonClick(bottomConfig.key)}
        size={24}
      />
    </div>
  );
};

export default BorderEditor;
