import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Slider",
  desc: "输入条",
  category: "数据录入",
  defaultProps: {},
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "range",
      label: "双滑块",
      type: "switch",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
