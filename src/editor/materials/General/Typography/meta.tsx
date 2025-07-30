import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Typography",
  desc: "排版",
  category: "基础",
  defaultProps: {
    content: "默认文本",
    type: "Text",
  },
  parentTypes: PT_GENERAL,
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
      // 核心改动：将数字数组转换为对象数组
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
} as Omit<ComponentConfig, "dev" | "prod">;
