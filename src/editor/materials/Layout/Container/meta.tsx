import type { ComponentConfig } from "../../../stores/component-config";
import { PT_LAYOUT } from "../../containerTypes";

export default {
  name: "Container",
  desc: "容器",
  category: "布局",
  defaultProps: {},
  // 容器自身也可以被放置在"页面"或另一个"容器"或"弹窗"中
  parentTypes: PT_LAYOUT,
} as Omit<ComponentConfig, "dev" | "prod">;
