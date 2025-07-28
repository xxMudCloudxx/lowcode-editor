import type { ComponentConfig } from "../../stores/component-config";

export default {
  name: "Button",
  desc: "按钮",
  category: "基础",
  defaultProps: {
    type: "primary",
    text: "按钮",
  },
  setter: [
    // {
    //   name: "type",
    //   label: "按钮类型",
    //   type: "select",
    //   options: [
    //     { label: "主按钮", value: "primary" },
    //     { label: "次按钮", value: "default" },
    //   ],
    // },
    // {
    //   name: "text",
    //   label: "文本",
    //   type: "input",
    // },
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
  parentTypes: ["Page", "Container", "Modal"],
} as Omit<ComponentConfig, "dev" | "prod">; // 使用 Omit 排除 dev 和 prod
