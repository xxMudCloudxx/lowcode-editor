/**
 * @file Image/meta.tsx
 * @description Image 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const ImageProtocol: ComponentProtocol = {
  name: "Image",
  desc: "图片",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    width: 200,
    src: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
    preview: true,
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    { name: "src", label: "图片地址", type: "textarea" },
    { name: "alt", label: "描述", type: "input" },
    { name: "width", label: "宽度", type: "inputNumber" },
    { name: "height", label: "高度", type: "inputNumber" },
    { name: "preview", label: "开启预览", type: "switch" },
    {
      name: "fallback",
      label: "失败地址",
      type: "input",
      props: { placeholder: "图片加载失败时的地址" },
    },
  ],
};

export default ImageProtocol;

