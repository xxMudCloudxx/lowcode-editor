import type { ComponentConfig } from "../../../stores/component-config";
import { PT_DATA } from "../../containerTypes";

export default {
  name: "Table",
  defaultProps: {
    bordered: false,
    size: "middle",
  },
  desc: "表格",
  category: "数据展示",
  setter: [
    {
      name: "url",
      label: "数据地址",
      type: "input",
    },
    {
      name: "bordered",
      label: "显示边框",
      type: "switch",
    },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["large", "middle", "small"],
    },
    {
      name: "showHeader",
      label: "显示表头",
      type: "switch",
      default: true, // antd 默认为 true
    },
  ],
  methods: [
    {
      name: "refresh",
      label: "刷新数据",
    },
  ],
  // 表格可以被放置在"页面"、"容器"或"弹窗"中
  parentTypes: PT_DATA,
} as Omit<ComponentConfig, "dev" | "prod">;
