/**
 * @file src/theme/antdTheme.ts
 * @description
 * Ant Design v5 ConfigProvider theme configuration.
 * Consumes design tokens to auto-style all Antd components.
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
    // Primary brand color
    colorPrimary: semantic.accent.default,
    colorPrimaryHover: semantic.accent.hover,

    // Background colors
    colorBgContainer: semantic.surface.elevated,
    colorBgLayout: semantic.surface.base,
    colorBgElevated: semantic.surface.elevated,

    // Text colors
    colorText: semantic.text.primary,
    colorTextSecondary: semantic.text.secondary,
    colorTextTertiary: semantic.text.tertiary,

    // Border
    colorBorder: semantic.border.default,
    colorBorderSecondary: semantic.border.subtle,

    // Status colors
    colorSuccess: semantic.state.success,
    colorWarning: semantic.state.warning,
    colorError: semantic.state.danger,

    // Shape
    borderRadius: radius.md,
    borderRadiusSM: radius.sm,
    borderRadiusLG: radius.lg,

    // Typography
    fontFamily: fontFamily.sans,

    // Sizing
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
  },

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
