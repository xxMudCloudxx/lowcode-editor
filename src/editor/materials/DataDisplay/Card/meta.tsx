// src/editor/materials/DataDisplay/Card/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Card",
  desc: "卡片",
  category: "数据展示",
  defaultProps: {
    title: "卡片标题",
    bordered: true,
  },
  parentTypes: ["Page", "Container", "Modal", "GridColumn", "ListItem"],
  setter: [
    {
      name: "title",
      label: "标题",
      type: "input",
    },
    {
      name: "bordered",
      label: "显示边框",
      type: "switch",
    },
    {
      name: "hoverable",
      label: "可悬浮",
      type: "switch",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
