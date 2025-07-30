import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Slider",
  desc: "滑动输入条",
  category: "数据录入",
  defaultProps: {
    range: false,
    disabled: false,
    min: 0,
    max: 100,
    step: 1,
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "range",
      label: "双滑块",
      type: "switch",
    },
    {
      name: "min",
      label: "最小值",
      type: "inputNumber",
    },
    {
      name: "max",
      label: "最大值",
      type: "inputNumber",
    },
    {
      name: "step",
      label: "步长",
      type: "inputNumber",
    },
    {
      name: "disabled",
      label: "禁用",
      type: "switch",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
