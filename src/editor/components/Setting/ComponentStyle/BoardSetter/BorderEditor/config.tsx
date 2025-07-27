import type { CSSProperties } from "react";
export interface BorderConfig {
  key: string;
  type: BorderType;
  // 这里可能还有其他属性，比如用于 accessibility 的 label 等
}

export type BorderType = "top" | "right" | "bottom" | "left" | "all";

export const borderConfigs: {
  key: keyof CSSProperties;
  type: BorderType; // ⬅️ 不再存 ReactNode
}[] = [
  { key: "borderTop", type: "top" },
  { key: "borderLeft", type: "left" },
  { key: "border", type: "all" },
  { key: "borderRight", type: "right" },
  { key: "borderBottom", type: "bottom" },
];

const borderTypeList = ["solid", "dashed", "dotted"];
export const borderTypeOptions = borderTypeList.map((type) => ({
  value: type,
  label: type,
}));
