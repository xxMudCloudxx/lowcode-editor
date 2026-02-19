/**
 * @file Grid/meta.tsx
 * @description Grid 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_LAYOUT } from "../../containerTypes";

const GridProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Grid",
  desc: "栅格-行",
  category: "布局",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    gutter: 1,
    justify: "start",
    align: "top",
    wrap: false,
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: true,
    parentTypes: PT_LAYOUT,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    {
      name: "gutter",
      label: "栅格间隔",
      type: "inputNumber",
    },
    {
      name: "justify",
      label: "水平排列方式",
      type: "select",
      options: [
        { label: "左对齐", value: "start" },
        { label: "右对齐", value: "end" },
        { label: "居中", value: "center" },
        { label: "两端对齐", value: "space-between" },
        { label: "均匀分布", value: "space-around" },
        { label: "等间距分布", value: "space-evenly" },
      ],
    },
    {
      name: "align",
      label: "垂直对齐方式",
      type: "select",
      options: [
        { label: "顶部对齐", value: "top" },
        { label: "中间对齐", value: "middle" },
        { label: "底部对齐", value: "bottom" },
      ],
    },
    {
      name: "wrap",
      label: "是否换行",
      type: "select",
      options: [
        { label: "是", value: true },
        { label: "否", value: false },
      ],
    },
  ],
};

export default GridProtocol;

