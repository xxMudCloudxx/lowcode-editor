import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Button",
  desc: "按钮",
  category: "基础",
  defaultProps: {
    type: "primary",
    text: "按钮",
  },
  setter: [
    {
      name: "type",
      label: "按钮类型",
      type: "radio",
      options: ["primary", "default", "dashed", "text", "link"],
    },
    {
      name: "size",
      label: "尺寸",
      type: "segmented",
      options: ["small", "middle", "large"],
    },
    { name: "danger", label: "危险态", type: "switch" },
    { name: "ghost", label: "幽灵", type: "switch" },
    { name: "block", label: "块级", type: "switch" },
    { name: "loading", label: "加载", type: "switch" },
    {
      name: "htmlType",
      label: "原生类型",
      type: "select",
      options: ["button", "submit", "reset"],
    },
    { name: "href", label: "链接", type: "input" },
    {
      name: "target",
      label: "打开方式",
      type: "select",
      options: ["_self", "_blank", "_parent", "_top"],
    },
    { name: "children", label: "文本", type: "input" },
  ],
  styleSetter: [
    // {
    //   name: "width",
    //   label: "宽度",
    //   type: "inputNumber",
    // },
    // {
    //   name: "height",
    //   label: "高度",
    //   type: "inputNumber",
    // },
  ],
  events: [
    {
      name: "onClick",
      label: "点击事件",
    },
    {
      name: "onDoubleClick",
      label: "双击事件",
    },
  ],
  parentTypes: PT_GENERAL,
} as Omit<ComponentConfig, "dev" | "prod">; // 使用 Omit 排除 dev 和 prod
