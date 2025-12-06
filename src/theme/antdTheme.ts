/**
 * @file src/theme/antdTheme.ts
 * @description
 * Ant Design v5 ConfigProvider 主题配置。
 * 消费设计令牌，自动为所有 Antd 组件应用主题样式。
 */

import type { ThemeConfig } from "antd";
import {
  neutral,
  accent,
  semantic,
  radius,
  fontFamily,
  danger,
} from "./tokens";

export const antdTheme: ThemeConfig = {
  token: {
    // 主色/品牌色
    colorPrimary: semantic.accent.default,
    colorPrimaryHover: semantic.accent.hover,

    // 背景颜色
    colorBgContainer: semantic.surface.elevated,
    colorBgLayout: semantic.surface.base,
    colorBgElevated: semantic.surface.elevated,

    // 文字颜色
    colorText: semantic.text.primary,
    colorTextSecondary: semantic.text.secondary,
    colorTextTertiary: semantic.text.tertiary,

    // 边框
    colorBorder: semantic.border.default,
    colorBorderSecondary: semantic.border.subtle,

    // 状态颜色
    colorSuccess: semantic.state.success,
    colorWarning: semantic.state.warning,
    colorError: semantic.state.danger,

    // 圆角
    borderRadius: radius.md,
    borderRadiusSM: radius.sm,
    borderRadiusLG: radius.lg,

    // 字体
    fontFamily: fontFamily.sans,

    // 控件尺寸
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
  },

  // 组件级别的样式覆盖
  components: {
    Button: {
      borderRadius: radius.md,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
    },

    Segmented: {
      trackBg: neutral[100],
      trackPadding: 4,
      itemSelectedBg: "#ffffff",
      borderRadiusSM: radius.sm,
    },

    Input: {
      borderRadius: radius.md,
      activeShadow: `0 0 0 2px ${accent[100]}`,
    },

    Select: {
      borderRadius: radius.md,
    },

    Popover: {
      borderRadiusLG: radius.lg,
    },

    Popconfirm: {
      colorWarning: danger[600],
    },

    Typography: {
      titleMarginBottom: 0,
    },
  },
};
