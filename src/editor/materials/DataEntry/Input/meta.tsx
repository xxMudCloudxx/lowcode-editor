import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Input",
  desc: "输入框",
  category: "数据录入",
  defaultProps: {
    placeholder: "请输入内容",
    disabled: false,
    allowClear: false,
    size: "middle",
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "placeholder",
      label: "占位文本",
      type: "input",
    },
    {
      name: "defaultValue",
      label: "默认值",
      type: "input",
    },
    {
      name: "size",
      label: "尺寸",
      type: "select",
      options: [
        { label: "大", value: "large" },
        { label: "中", value: "middle" },
        { label: "小", value: "small" },
      ],
    },
    {
      name: "type",
      label: "类型",
      type: "select",
      options: [
        { label: "文本", value: "text" },
        { label: "密码", value: "password" },
      ],
    },
    {
      name: "addonBefore",
      label: "前置标签",
      type: "input",
    },
    {
      name: "addonAfter",
      label: "后置标签",
      type: "input",
    },
    {
      name: "prefix",
      label: "前缀图标",
      type: "input",
      props: {
        placeholder: "例如：UserOutlined",
      },
    },
    {
      name: "suffix",
      label: "后缀图标",
      type: "input",
      props: {
        placeholder: "例如：InfoCircleOutlined",
      },
    },
    {
      name: "maxLength",
      label: "最大长度",
      type: "inputNumber",
    },
    {
      name: "showCount",
      label: "显示字数",
      type: "switch",
    },
    {
      name: "allowClear",
      label: "允许清除",
      type: "switch",
    },
    {
      name: "disabled",
      label: "禁用",
      type: "switch",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
