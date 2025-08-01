import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "GridColumn",
  desc: "栅格-列",
  category: "布局",
  defaultProps: {
    span: 12,
    offset: 0,
  },
  setter: [
    {
      name: "span",
      label: "占位格数",
      type: "inputNumber",
      min: 1,
      max: 24,
    },
    {
      name: "offset",
      label: "左侧间隔格数",
      type: "inputNumber",
      min: 0,
      max: 23,
    },
    {
      name: "order",
      label: "栅格顺序",
      type: "inputNumber",
    },
    {
      name: "pull",
      label: "向左移动格数",
      type: "inputNumber",
      min: 0,
      max: 24,
    },
    {
      name: "push",
      label: "向右移动格数",
      type: "inputNumber",
      min: 0,
      max: 24,
    },
  ],
  parentTypes: ["Grid"],
} as Omit<ComponentConfig, "dev" | "prod">;
