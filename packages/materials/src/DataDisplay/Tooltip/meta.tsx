/**
 * @file Tooltip/meta.tsx
 * @description Tooltip 组件协议配置（容器组件）
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const TooltipProtocol: ComponentProtocol = {
  name: "Tooltip",
  desc: "文字提示",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    title: "提示文字",
    placement: "top",
  },

  editor: {
    isContainer: true,
    parentTypes: PT_GENERAL,
    interactiveInEditor: true, // 允许悬浮查看效果
    display: "inline-block",
  },

  setter: [
    { name: "title", label: "提示文字", type: "input" },
    {
      name: "placement",
      label: "位置",
      type: "select",
      options: [
        "top",
        "left",
        "right",
        "bottom",
        "topLeft",
        "topRight",
        "bottomLeft",
        "bottomRight",
        "leftTop",
        "leftBottom",
        "rightTop",
        "rightBottom",
      ],
    },
  ],
};

export default TooltipProtocol;

