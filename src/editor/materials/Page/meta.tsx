import type { ComponentConfig } from "../../stores/component-config";

export default {
  name: "Page",
  desc: "页面",
  defaultProps: {},
} as Omit<ComponentConfig, "dev" | "prod">;
