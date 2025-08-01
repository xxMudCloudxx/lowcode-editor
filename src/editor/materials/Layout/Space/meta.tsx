import type { ComponentConfig } from "../../../stores/component-config";
import { PT_LAYOUT } from "../../containerTypes";

export default {
  name: "Space",
  desc: "间距",
  category: "布局",
  defaultProps: {
    direction: "horizontal",
    size: "small",
    align: "center",
    wrap: false,
  },
  // Space 组件自身也是一个容器，可以放置在其他布局容器中
  parentTypes: PT_LAYOUT,
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
} as Omit<ComponentConfig, "dev" | "prod">;
