/**
 * @file InputNumber/meta.tsx
 * @description InputNumber 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const InputNumberProtocol: ComponentProtocol = {
  name: "InputNumber",
  desc: "数字输入框",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    placeholder: "请输入数字",
    disabled: false,
    min: -Infinity,
    max: Infinity,
    step: 1,
    controls: true,
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    { name: "placeholder", label: "占位文本", type: "input" },
    { name: "min", label: "最小值", type: "inputNumber" },
    { name: "max", label: "最大值", type: "inputNumber" },
    { name: "step", label: "步长", type: "inputNumber" },
    {
      name: "precision",
      label: "精度",
      type: "inputNumber",
      props: { min: 0, step: 1, placeholder: "小数位数" },
    },
    { name: "controls", label: "显示按钮", type: "switch" },
    {
      name: "prefix",
      label: "前缀",
      type: "input",
      props: { placeholder: "例如：￥" },
    },
    { name: "disabled", label: "禁用", type: "switch" },
  ],
};

export default InputNumberProtocol;

