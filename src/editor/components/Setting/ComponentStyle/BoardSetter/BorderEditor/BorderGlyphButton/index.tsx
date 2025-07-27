import React from "react";
import CustomIconButton from "../../../../../common/CustomIconButton";
import { BorderBlockGlyph } from "../../../../../common/BorderSideGlyph";
import { borderConfigs, type BorderConfig } from "../config";

// =================================================================
// 内部使用的子组件，它封装了单个按钮的渲染逻辑
interface BorderGlyphButtonProps {
  config: BorderConfig;
  activeKey: string;
  onButtonClick: (key: string) => void;
}

const BorderGlyphButton: React.FC<BorderGlyphButtonProps> = ({
  config,
  activeKey,
  onButtonClick,
}) => {
  return (
    <CustomIconButton
      icon={
        <BorderBlockGlyph
          type={config.type}
          active={activeKey === config.key}
        />
      }
      onClick={() => onButtonClick(config.key)}
      size={24}
    />
  );
};
// =================================================================

// BorderControls 组件的 Props 接口
interface BorderControlsProps {
  activeKey: string;
  onButtonClick: (key: string) => void;
}

// 这就是我们提取出来的“五按钮”组件
export const BorderControls: React.FC<BorderControlsProps> = ({
  activeKey,
  onButtonClick,
}) => {
  // 所有跟按钮布局和配置相关的逻辑，都内聚到这里
  const [topConfig, leftConfig, allConfig, rightConfig, bottomConfig] =
    borderConfigs;
  const middleRowConfigs = [leftConfig, allConfig, rightConfig];

  return (
    <div className="flex flex-col w-[100px] h-[100%] items-center justify-around">
      {/* 顶部按钮 */}
      <BorderGlyphButton
        config={topConfig}
        activeKey={activeKey}
        onButtonClick={onButtonClick}
      />

      {/* 中间行按钮 */}
      <div className="flex flex-row items-center justify-center">
        {middleRowConfigs.map((config) => (
          <BorderGlyphButton
            key={config.key}
            config={config}
            activeKey={activeKey}
            onButtonClick={onButtonClick}
          />
        ))}
      </div>

      {/* 底部按钮 */}
      <BorderGlyphButton
        config={bottomConfig}
        activeKey={activeKey}
        onButtonClick={onButtonClick}
      />
    </div>
  );
};
