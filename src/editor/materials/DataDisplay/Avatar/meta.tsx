// src/editor/materials/DataDisplay/Avatar/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Avatar",
  desc: "头像",
  category: "数据展示",
  defaultProps: {
    shape: "circle",
    size: "default",
    icon: "UserOutlined",
  },
  parentTypes: PT_GENERAL,
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
    {
      name: "src",
      label: "图片地址",
      type: "input",
    },
    {
      name: "icon",
      label: "图标类型",
      type: "input",
      // 提示：这里也可以改成Select，但为了简单先用Input
    },
    {
      name: "alt",
      label: "替代文本",
      type: "input",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
