import type { ComponentConfig } from "../../../stores/component-config";
import { PT_NAVIGATION } from "../../containerTypes";

export default {
  name: "Dropdown",
  desc: "下拉菜单",
  category: "导航",
  defaultProps: {
    menu: {
      items: [
        { key: "1", label: "菜单项一" },
        { key: "2", label: "菜单项二" },
        { key: "3", label: "菜单项三" },
      ],
    },
    buttonText: "鼠标悬浮",
  },
  setter: [
    {
      //  使用数组来指定要绑定的嵌套属性
      name: ["menu", "items"],
      label: "菜单项",
      type: "custom",
      component: "AttrListSetter",
      // 为 ListSetter 提供 Dropdown items 的配置
      props: {
        itemProps: [
          { name: "key", label: "唯一标识" },
          { name: "label", label: "菜单名" },
        ],
        defaultItem: { key: "new-menu-item", label: "新菜单项" },
      },
    },
    {
      name: "buttonText",
      label: "按钮文本",
      type: "input",
    },
    {
      name: "trigger",
      label: "触发方式",
      type: "select",
      options: [
        { label: "悬浮", value: "hover" },
        { label: "点击", value: "click" },
      ],
    },
  ],
  parentTypes: PT_NAVIGATION,
} as Omit<ComponentConfig, "dev" | "prod">;
