import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Image",
  desc: "图片",
  category: "数据展示",
  defaultProps: {
    width: 200,
    src: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
    preview: true,
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "src",
      label: "图片地址",
      type: "textarea",
    },
    {
      name: "alt",
      label: "描述",
      type: "input",
    },
    {
      name: "width",
      label: "宽度",
      type: "inputNumber",
    },
    {
      name: "height",
      label: "高度",
      type: "inputNumber",
    },
    {
      name: "preview",
      label: "开启预览",
      type: "switch",
    },
    {
      name: "fallback",
      label: "失败地址",
      type: "input",
      props: {
        placeholder: "图片加载失败时的地址",
      },
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
