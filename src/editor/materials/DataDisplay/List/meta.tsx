// src/editor/materials/DataDisplay/List/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "List",
  desc: "列表",
  category: "数据展示",
  defaultProps: {
    bordered: true,
    header: "列表头部",
    footer: "列表尾部",
  },
  parentTypes: ["Page", "Container", "Modal", "GridColumn"],
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
