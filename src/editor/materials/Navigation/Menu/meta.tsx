/**
 * @file Menu/meta.tsx
 * @description Menu 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_NAVIGATION } from "../../containerTypes";

const MenuProtocol: ComponentProtocol = {
  name: "Menu",
  desc: "导航菜单",
  category: "导航",

  component: lazy(() => import("./index")),
  defaultProps: {
    mode: "horizontal",
    items: [
      { key: "home", label: "导航一" },
      { key: "mail", label: "导航二" },
      { key: "app", label: "导航三" },
    ],
  },

  editor: {
    isContainer: false,
    parentTypes: PT_NAVIGATION,
  },

  setter: [
    {
      name: "items",
      label: "菜单项",
      type: "custom",
      component: "AttrListSetter",
      props: {
        itemProps: [
          { name: "key", label: "唯一标识" },
          { name: "label", label: "菜单名" },
        ],
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
};

export default MenuProtocol;
