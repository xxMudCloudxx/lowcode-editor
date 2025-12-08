/**
 * @file Card/meta.tsx
 * @description Card 组件协议配置（容器组件）
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_CARD } from "../../containerTypes";

const CardProtocol: ComponentProtocol = {
  name: "Card",
  desc: "卡片",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    title: "卡片标题",
    bordered: true,
  },

  editor: {
    isContainer: true,
    parentTypes: PT_CARD,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    { name: "title", label: "标题", type: "input" },
    { name: "bordered", label: "显示边框", type: "switch" },
    { name: "hoverable", label: "可悬浮", type: "switch" },
  ],
};

export default CardProtocol;
