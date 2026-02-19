/**
 * @file TableColumn/meta.tsx
 * @description TableColumn 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";

const TableColumnProtocol: ComponentProtocol = {
  name: "TableColumn",
  desc: "表格列",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    dataIndex: `col_${Date.now()}`,
    title: "列名",
  },

  editor: {
    isContainer: false,
    parentTypes: ["Table"],
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    {
      name: "type",
      label: "类型",
      type: "select",
      options: [
        { label: "文本", value: "text" },
        { label: "日期", value: "date" },
      ],
    },
    { name: "title", label: "标题", type: "input" },
    { name: "dataIndex", label: "字段", type: "input" },
  ],
};

export default TableColumnProtocol;

