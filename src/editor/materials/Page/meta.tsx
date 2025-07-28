import type { ComponentConfig } from "../../stores/component-config";

export default {
  name: "Page",
  desc: "页面",
  category: "布局",
  defaultProps: {},
} as Omit<ComponentConfig, "dev" | "prod">;
