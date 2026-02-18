/**
 * @file Pagination/meta.tsx
 * @description Pagination 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_PAGE_LEVEL } from "../../containerTypes";

const PaginationProtocol: ComponentProtocol = {
  name: "Pagination",
  desc: "分页",
  category: "导航",

  component: lazy(() => import("./index")),
  defaultProps: {
    defaultCurrent: 1,
    total: 50,
  },

  editor: {
    isContainer: false,
    parentTypes: PT_PAGE_LEVEL,
  },

  setter: [
    {
      name: "defaultCurrent",
      label: "默认页码",
      type: "inputNumber",
    },
    {
      name: "total",
      label: "数据总数",
      type: "inputNumber",
    },
    {
      name: "pageSize",
      label: "每页条数",
      type: "inputNumber",
    },
  ],
};

export default PaginationProtocol;
