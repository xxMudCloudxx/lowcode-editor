/**
 * @file Table/meta.tsx
 * @description Table 组件协议配置（容器组件）
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_DATA } from "../../containerTypes";

const TableProtocol: ComponentProtocol = {
  name: "Table",
  desc: "表格",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    bordered: false,
    size: "middle",
  },

  editor: {
    isContainer: true,
    parentTypes: PT_DATA,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    { name: "url", label: "数据地址", type: "input" },
    { name: "bordered", label: "显示边框", type: "switch" },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["large", "middle", "small"],
    },
    { name: "showHeader", label: "显示表头", type: "switch" },
  ],

  methods: [{ name: "refresh", label: "刷新数据" }],
};

export default TableProtocol;

