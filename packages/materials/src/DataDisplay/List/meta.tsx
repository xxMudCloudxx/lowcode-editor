/**
 * @file List/meta.tsx
 * @description List 组件协议配置（容器组件）
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_LIST } from "../../containerTypes";

const ListProtocol: ComponentProtocol = {
  name: "List",
  desc: "列表",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    bordered: true,
    header: "列表头部",
    footer: "列表尾部",
  },

  editor: {
    isContainer: true,
    parentTypes: PT_LIST,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    { name: "bordered", label: "显示边框", type: "switch" },
    { name: "header", label: "列表头部", type: "input" },
    { name: "footer", label: "列表尾部", type: "input" },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["large", "default", "small"],
    },
  ],
};

export default ListProtocol;
