/**
 * @file Button/meta.tsx
 * @description Button 组件协议配置
 *
 * 使用新的 ComponentProtocol 格式，包含：
 * - 身份层：name, desc, category
 * - 渲染层：component, defaultProps
 * - 编辑层：editor, setter, events
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const ButtonProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Button",
  desc: "按钮",
  category: "基础",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    type: "primary",
    text: "按钮",
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    // 编辑时点击不触发按钮，只选中
    interactiveInEditor: false,
    display: "inline-block",
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
    { name: "text", label: "文本", type: "input" },
  ],

  events: [
    { name: "onClick", label: "点击事件" },
    { name: "onDoubleClick", label: "双击事件" },
  ],
};

export default ButtonProtocol;

