import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Breadcrumb",
  desc: "面包屑",
  category: "导航",
  defaultProps: {
    items: [{ title: "首页" }, { title: "应用中心" }, { title: "应用列表" }],
  },
  setter: [
    {
      name: "items",
      label: "面包屑项",
      type: "custom",
      component: "BreadcrumbSetter",
    },
  ],
  // 定义它可以被放置在哪些容器组件中
  parentTypes: ["Page", "Container", "Modal", "GridColumn"],
} as Omit<ComponentConfig, "dev" | "prod">;
