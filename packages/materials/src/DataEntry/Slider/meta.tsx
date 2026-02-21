/**
 * @file Slider/meta.tsx
 * @description Slider 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const SliderProtocol: ComponentProtocol = {
  name: "Slider",
  desc: "输入条",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    range: false,
    disabled: false,
    min: 0,
    max: 100,
    step: 1,
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    { name: "range", label: "双滑块", type: "switch" },
    { name: "min", label: "最小值", type: "inputNumber" },
    { name: "max", label: "最大值", type: "inputNumber" },
    { name: "step", label: "步长", type: "inputNumber" },
    { name: "disabled", label: "禁用", type: "switch" },
    { name: "vertical", label: "垂直模式", type: "switch" },
  ],
};

export default SliderProtocol;

