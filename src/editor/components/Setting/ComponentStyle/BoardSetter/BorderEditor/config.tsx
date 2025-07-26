import type { CSSProperties } from "react";

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
