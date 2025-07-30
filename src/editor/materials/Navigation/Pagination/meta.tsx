import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Pagination",
  desc: "分页",
  category: "导航",
  defaultProps: {
    defaultCurrent: 1,
    total: 50,
  },
  setter: [
    {
      name: "defaultCurrent",
      label: "默认页码",
      type: "inputNumber",
    },
    {
      name: "total",
      label: "数据总数",
      type: "inputNumber",
    },
    {
      name: "pageSize",
      label: "每页条数",
      type: "inputNumber",
    },
  ],
  parentTypes: ["Page", "Container", "Modal", "GridColumn"],
} as Omit<ComponentConfig, "dev" | "prod">;
