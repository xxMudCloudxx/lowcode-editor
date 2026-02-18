/**
 * @file Dropdown/meta.tsx
 * @description Dropdown 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_NAVIGATION } from "../../containerTypes";

const DropdownProtocol: ComponentProtocol = {
  name: "Dropdown",
  desc: "下拉菜单",
  category: "导航",

  component: lazy(() => import("./index")),
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

  editor: {
    isContainer: false,
    parentTypes: PT_NAVIGATION,
  },

  setter: [
    {
      name: ["menu", "items"],
      label: "菜单项",
      type: "custom",
      component: "AttrListSetter",
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
};

export default DropdownProtocol;
