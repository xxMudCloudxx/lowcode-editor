/**
 * @file src/theme/tokens.ts
 * @description
 * Design tokens - the source of truth for the design system.
 * These values are consumed by Antd ConfigProvider.
 *
 * ⚠️ TECH DEBT: These values must be manually synced with index.css @theme directive.
 * If you change a color here, update index.css as well.
 */

// =============================================================================
// COLOR PALETTE (Numbered shades 50-900)
// =============================================================================

/**
 * Neutral palette - warm stone grays for a premium, spa-like aesthetic
 * Created using gradient division with subtle warm hue adjustment
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
 * Accent palette - sophisticated slate blue
 * Cool, minimalist, premium feel
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
 * Status colors - muted for premium aesthetic
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
// SEMANTIC TOKENS (Purpose-based naming)
// =============================================================================

export const semantic = {
  text: {
    primary: neutral[900],
    secondary: neutral[500],
    tertiary: neutral[400],
    inverse: "#ffffff",
    accent: accent[600],
  },
  surface: {
    base: neutral[50],
    elevated: "#ffffff",
    sunken: neutral[100],
  },
  border: {
    default: neutral[200],
    subtle: neutral[100],
    strong: neutral[300],
    focus: accent[500],
  },
  accent: {
    default: accent[600],
    hover: accent[700],
    subtle: accent[100],
  },
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
// SPACING & SIZING
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
// TYPOGRAPHY
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
// SHADOWS
// =============================================================================

export const shadow = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  md: "0 2px 4px -1px rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
  lg: "0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
} as const;
