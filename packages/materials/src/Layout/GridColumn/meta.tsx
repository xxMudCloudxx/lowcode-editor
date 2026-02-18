/**
 * @file GridColumn/meta.tsx
 * @description GridColumn 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";

const GridColumnProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "GridColumn",
  desc: "栅格-列",
  category: "布局",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    span: 12,
    offset: 0,
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: true,
    parentTypes: ["Grid"],
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    {
      name: "span",
      label: "占位格数",
      type: "inputNumber",
      min: 1,
      max: 24,
    },
    {
      name: "offset",
      label: "左侧间隔格数",
      type: "inputNumber",
      min: 0,
      max: 23,
    },
    {
      name: "order",
      label: "栅格顺序",
      type: "inputNumber",
    },
    {
      name: "pull",
      label: "向左移动格数",
      type: "inputNumber",
      min: 0,
      max: 24,
    },
    {
      name: "push",
      label: "向右移动格数",
      type: "inputNumber",
      min: 0,
      max: 24,
    },
  ],
};

export default GridColumnProtocol;
