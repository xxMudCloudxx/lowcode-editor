import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Container",
  desc: "容器",
  category: "布局",
  defaultProps: {},
  // 容器自身也可以被放置在“页面”或另一个“容器”或“弹窗”中
  parentTypes: ["Page", "Container", "Modal"],
} as Omit<ComponentConfig, "dev" | "prod">;
