import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "PageHeader",
  desc: "页头",
  category: "导航",
  defaultProps: {
    title: "页面标题",
    subTitle: "这是一个副标题",
  },
  setter: [
    {
      name: "title",
      label: "主标题",
      type: "input",
    },
    {
      name: "subTitle",
      label: "副标题",
      type: "input",
    },
  ],
  parentTypes: ["Page", "Container", "Modal", "GridColumn"],
} as Omit<ComponentConfig, "dev" | "prod">;
