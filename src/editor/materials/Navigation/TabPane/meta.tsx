// src/editor/materials/Navigation/TabPane/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "TabPane",
  desc: "标签项",
  category: "导航",
  defaultProps: {
    tab: "标签项",
  },
  // 关键：声明自己只能是 Tabs 的子组件
  parentTypes: ["Tabs"],
  setter: [
    {
      name: "tab",
      label: "标签标题",
      type: "input",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
