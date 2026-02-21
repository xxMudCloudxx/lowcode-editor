/**
 * @file Avatar/meta.tsx
 * @description Avatar 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const AvatarProtocol: ComponentProtocol = {
  name: "Avatar",
  desc: "头像",
  category: "数据展示",

  component: lazy(() => import("./index")),
  defaultProps: {
    shape: "circle",
    size: "default",
    icon: "UserOutlined",
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    {
      name: "shape",
      label: "形状",
      type: "radio",
      options: ["circle", "square"],
    },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["large", "default", "small"],
    },
    { name: "src", label: "图片地址", type: "input" },
    { name: "icon", label: "图标类型", type: "input" },
    { name: "alt", label: "替代文本", type: "input" },
  ],
};

export default AvatarProtocol;

