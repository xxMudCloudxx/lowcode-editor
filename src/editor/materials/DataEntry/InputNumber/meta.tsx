import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "InputNumber",
  desc: "数字输入框",
  category: "数据录入",
  defaultProps: {
    placeholder: "请输入数字",
    disabled: false,
    min: -Infinity,
    max: Infinity,
    step: 1,
    controls: true,
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "placeholder",
      label: "占位文本",
      type: "input",
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
      name: "precision",
      label: "精度",
      type: "inputNumber",
      props: {
        min: 0,
        step: 1,
        placeholder: "小数位数",
      },
    },
    {
      name: "controls",
      label: "显示按钮",
      type: "switch",
    },
    {
      name: "prefix",
      label: "前缀",
      type: "input",
      props: {
        placeholder: "例如：￥",
      },
    },
    {
      name: "formatter",
      label: "格式化显示",
      type: "input",
      props: {
        placeholder: "例如：value => `$ ${value}`",
      },
    },
    {
      name: "parser",
      label: "格式化解析",
      type: "input",
      props: {
        placeholder: "例如：value => value.replace('$ ', '')",
      },
    },
    {
      name: "disabled",
      label: "禁用",
      type: "switch",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
