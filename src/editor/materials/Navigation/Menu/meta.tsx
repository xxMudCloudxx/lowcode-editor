import type { ComponentConfig } from "../../../stores/component-config";
import { PT_NAVIGATION } from "../../containerTypes";

export default {
  name: "Menu",
  desc: "导航菜单",
  category: "导航",
  defaultProps: {
    mode: "horizontal",
    items: [
      { key: "home", label: "导航一" },
      { key: "mail", label: "导航二" },
      { key: "app", label: "导航三" },
    ],
  },
  setter: [
    {
      name: "items",
      label: "菜单项",
      type: "custom",
      component: "AttrListSetter",
      // 为 AttrListSetter 提供它需要的配置
      props: {
        // 定义每一项有两个字段：key 和 label
        itemProps: [
          { name: "key", label: "唯一标识" },
          { name: "label", label: "菜单名" },
        ],
        // 定义新增一项时的默认数据结构
        defaultItem: { key: "new-item", label: "新菜单" },
      },
    },
    {
      name: "mode",
      label: "菜单类型",
      type: "select",
      options: ["vertical", "horizontal", "inline"],
    },
  ],
  parentTypes: PT_NAVIGATION,
} as Omit<ComponentConfig, "dev" | "prod">;
