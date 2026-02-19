/**
 * @file PageHeader/meta.tsx
 * @description PageHeader 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_PAGE_LEVEL } from "../../containerTypes";

const PageHeaderProtocol: ComponentProtocol = {
  name: "PageHeader",
  desc: "页头",
  category: "导航",

  component: lazy(() => import("./index")),
  defaultProps: {
    title: "页面标题",
    subTitle: "这是一个副标题",
  },

  editor: {
    isContainer: false,
    parentTypes: PT_PAGE_LEVEL,
  },

  setter: [
    {
      name: "title",
      label: "主标题",
      type: "input",
    },
    {
      name: "subTitle",
      label: "副标题",
      type: "input",
    },
  ],
};

export default PageHeaderProtocol;

