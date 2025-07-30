// src/editor/materials/Navigation/Tabs/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";
import { PT_LAYOUT } from "../../containerTypes";

export default {
  name: "Tabs",
  desc: "标签页",
  category: "导航",
  defaultProps: {
    type: "line",
    tabPosition: "top",
  },
  parentTypes: PT_LAYOUT,
  // 属性设置器
  setter: [
    {
      name: "type",
      label: "页签类型",
      type: "select",
      options: [
        { label: "线形", value: "line" },
        { label: "卡片", value: "card" },
        { label: "可编辑卡片", value: "editable-card" },
      ],
    },
    {
      name: "tabPosition",
      label: "页签位置",
      type: "select",
      options: [
        { label: "上", value: "top" },
        { label: "下", value: "bottom" },
        { label: "左", value: "left" },
        { label: "右", value: "right" },
      ],
    },
    {
      name: "centered",
      label: "标签居中",
      type: "switch",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
