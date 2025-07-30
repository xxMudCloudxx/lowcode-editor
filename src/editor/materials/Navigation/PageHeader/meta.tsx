import type { ComponentConfig } from "../../../stores/component-config";
import { PT_PAGE_LEVEL } from "../../containerTypes";

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
  parentTypes: PT_PAGE_LEVEL,
} as Omit<ComponentConfig, "dev" | "prod">;
