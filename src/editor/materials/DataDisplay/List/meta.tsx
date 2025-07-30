// src/editor/materials/DataDisplay/List/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";
import { PT_LIST } from "../../containerTypes";

export default {
  name: "List",
  desc: "列表",
  category: "数据展示",
  defaultProps: {
    bordered: true,
    header: "列表头部",
    footer: "列表尾部",
  },
  parentTypes: PT_LIST,
  setter: [
    {
      name: "bordered",
      label: "显示边框",
      type: "switch",
    },
    {
      name: "header",
      label: "列表头部",
      type: "input",
    },
    {
      name: "footer",
      label: "列表尾部",
      type: "input",
    },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["large", "default", "small"],
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
