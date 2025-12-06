/**
 * @file src/theme/tokens.ts
 * @description
 * 设计令牌 - 设计系统的单一真值源。
 * 这些值被 Antd ConfigProvider 消费。
 *
 * ⚠️ 技术债务：这些值必须与 index.css @theme 指令手动同步。
 * 如果在此修改颜色，请同时更新 index.css。
 */

// =============================================================================
// 颜色色板 (50-900 分级)
// =============================================================================

/**
 * 中性色板 - 温暖的石灰色，打造高级 SPA 风格
 * 使用渐变分割法创建，带有轻微的暖色调调整
 */
export const neutral = {
  50: "#fafaf9",
  100: "#f5f5f4",
  200: "#e7e5e4",
  300: "#d6d3d1",
  400: "#a8a29e",
  500: "#78716c",
  600: "#57534e",
  700: "#44403c",
  800: "#292524",
  900: "#1c1917",
} as const;

/**
 * 强调色板 - 精致的石板蓝
 * 冷色调、简约、高级感
 */
export const accent = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
} as const;

/**
 * 状态颜色 - 柔和的配色以保持高级感
 */
export const success = {
  50: "#f0fdf4",
  100: "#dcfce7",
  500: "#22c55e",
  600: "#16a34a",
  700: "#15803d",
} as const;

export const warning = {
  50: "#fffbeb",
  100: "#fef3c7",
  500: "#f59e0b",
  600: "#d97706",
  700: "#b45309",
} as const;

export const danger = {
  50: "#fef2f2",
  100: "#fee2e2",
  500: "#ef4444",
  600: "#dc2626",
  700: "#b91c1c",
} as const;

// =============================================================================
// 语义化令牌 (基于用途命名)
// =============================================================================

export const semantic = {
  /** 文字颜色 */
  text: {
    primary: neutral[900], // 主要文字
    secondary: neutral[500], // 次要文字
    tertiary: neutral[400], // 辅助文字
    inverse: "#ffffff", // 反色文字（深色背景上）
    accent: accent[600], // 强调文字
  },
  /** 表面/背景颜色 */
  surface: {
    base: neutral[50], // 页面底色
    elevated: "#ffffff", // 卡片、弹窗等抬升表面
    sunken: neutral[100], // 凹陷表面
  },
  /** 边框颜色 */
  border: {
    default: neutral[200], // 默认边框
    subtle: neutral[100], // 轻微边框
    strong: neutral[300], // 强调边框
    focus: accent[500], // 聚焦边框
  },
  /** 强调色 */
  accent: {
    default: accent[600], // 主色
    hover: accent[700], // 悬停态
    subtle: accent[100], // 浅色背景
  },
  /** 状态颜色 */
  state: {
    success: success[600],
    successSubtle: success[50],
    warning: warning[600],
    warningSubtle: warning[50],
    danger: danger[600],
    dangerSubtle: danger[50],
  },
} as const;

// =============================================================================
// 间距与尺寸
// =============================================================================

export const spacing = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

// =============================================================================
// 字体
// =============================================================================

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
} as const;

// =============================================================================
// 阴影
// =============================================================================

export const shadow = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  md: "0 2px 4px -1px rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
  lg: "0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
} as const;
