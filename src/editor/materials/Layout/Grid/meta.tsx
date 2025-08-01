import type { ComponentConfig } from "../../../stores/component-config";
import { PT_LAYOUT } from "../../containerTypes";

export default {
  name: "Grid",
  defaultProps: {
    gutter: 1,
    justify: "start",
    align: "top",
    wrap: false,
  },
  desc: "栅格-行",
  category: "布局",
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
  parentTypes: PT_LAYOUT,
} as Omit<ComponentConfig, "dev" | "prod">;
