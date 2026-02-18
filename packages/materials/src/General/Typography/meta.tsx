/**
 * @file Typography/meta.tsx
 * @description Typography 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const TypographyProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Typography",
  desc: "排版",
  category: "基础",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    content: "默认文本",
    type: "Text",
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    {
      name: "content",
      label: "内容",
      type: "textarea",
    },
    {
      name: "type",
      label: "类型",
      type: "select",
      options: ["Text", "Title", "Paragraph"],
    },
    {
      name: "level",
      label: "标题等级",
      type: "select",
      options: [
        { label: "H1", value: 1 },
        { label: "H2", value: 2 },
        { label: "H3", value: 3 },
        { label: "H4", value: 4 },
        { label: "H5", value: 5 },
      ],
    },
    {
      name: "strong",
      label: "加粗",
      type: "switch",
    },
    {
      name: "italic",
      label: "斜体",
      type: "switch",
    },
    {
      name: "underline",
      label: "下划线",
      type: "switch",
    },
  ],
};

export default TypographyProtocol;
