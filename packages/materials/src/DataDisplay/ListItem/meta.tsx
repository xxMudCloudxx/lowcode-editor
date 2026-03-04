/**
 * @file ListItem/meta.tsx
 * @description ListItem 组件协议配置（容器组件）
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";

const ListItemProtocol: ComponentProtocol = {
  name: "ListItem",
  desc: "列表项",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {},

  editor: {
    isContainer: true,
    parentTypes: ["List"],
    interactiveInEditor: false,
    display: "block",
  },

  setter: [],

  // ===== 出码层 =====
  codegen: {
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "List",
      subName: "Item",
    },
    isContainer: true,
  },
};

export default ListItemProtocol;
