import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Tooltip",
  desc: "文字提示",
  category: "数据展示",
  defaultProps: {
    title: "提示文字",
    placement: "top",
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "title",
      label: "提示文字",
      type: "input",
    },
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
} as Omit<ComponentConfig, "dev" | "prod">;
