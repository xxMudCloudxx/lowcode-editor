/**
 * @file Breadcrumb/meta.tsx
 * @description Breadcrumb 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_LAYOUT } from "../../containerTypes";

const BreadcrumbProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Breadcrumb",
  desc: "面包屑",
  category: "导航",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    items: [{ title: "首页" }, { title: "应用中心" }, { title: "应用列表" }],
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: false,
    parentTypes: PT_LAYOUT,
  },

  setter: [
    {
      name: "items",
      label: "面包屑项",
      type: "custom",
      component: "BreadcrumbSetter",
    },
  ],

  // ===== 出码层 =====
  codegen: {
    dependency: { package: "antd", version: "^5.0.0", destructuring: true },
    isContainer: true,
  },
};

export default BreadcrumbProtocol;
