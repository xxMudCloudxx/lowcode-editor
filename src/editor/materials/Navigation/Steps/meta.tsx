import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Steps",
  desc: "步骤条",
  category: "导航",
  defaultProps: {
    current: 0,
    items: [
      { title: "第一步", description: "这是描述" },
      { title: "第二步", description: "这是描述" },
      { title: "第三步", description: "这是描述" },
    ],
  },
  setter: [
    {
      name: "current",
      label: "当前步骤",
      type: "inputNumber",
    },
    {
      name: "items",
      label: "步骤配置",
      type: "custom",
      component: "AttrListSetter",
      // 为 AttrListSetter 提供它所需要的配置
      props: {
        // 定义 Steps 的每一项有两个字段：title 和 description
        itemProps: [
          { name: "title", label: "标题" },
          { name: "description", label: "描述" },
        ],
        // 定义新增一项时的默认数据结构
        defaultItem: {
          key: "new-step",
          title: "新步骤",
          description: "这是描述",
        },
      },
    },
  ],
  parentTypes: ["Page", "Container", "Modal", "GridColumn"],
} as Omit<ComponentConfig, "dev" | "prod">;
