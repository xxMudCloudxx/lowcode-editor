/**
 * @file Space/meta.tsx
 * @description Space 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_LAYOUT } from "../../containerTypes";

const SpaceProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Space",
  desc: "间距",
  category: "布局",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    direction: "horizontal",
    size: "small",
    align: "center",
    wrap: false,
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: true,
    parentTypes: PT_LAYOUT,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    {
      name: "direction",
      label: "方向",
      type: "radio",
      options: ["horizontal", "vertical"],
    },
    {
      name: "align",
      label: "对齐方式",
      type: "select",
      options: [
        { label: "起点", value: "start" },
        { label: "终点", value: "end" },
        { label: "居中", value: "center" },
        { label: "基线", value: "baseline" },
      ],
    },
    {
      name: "size",
      label: "间距大小",
      type: "segmented",
      options: [
        { label: "小", value: "small" },
        { label: "中", value: "middle" },
        { label: "大", value: "large" },
      ],
    },
    {
      name: "wrap",
      label: "自动换行",
      type: "switch",
    },
  ],
};

export default SpaceProtocol;
