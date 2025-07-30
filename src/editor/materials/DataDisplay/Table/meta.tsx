import type { ComponentConfig } from "../../../stores/component-config";
import { PT_DATA } from "../../containerTypes";

export default {
  name: "Table",
  defaultProps: {},
  desc: "表格",
  category: "数据展示",
  setter: [
    {
      name: "url",
      label: "url",
      type: "input",
    },
  ],
  // 表格可以被放置在"页面"、"容器"或"弹窗"中
  parentTypes: PT_DATA,
} as Omit<ComponentConfig, "dev" | "prod">;
