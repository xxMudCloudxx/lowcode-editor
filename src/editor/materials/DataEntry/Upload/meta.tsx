import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Upload",
  desc: "上传",
  category: "数据录入",
  defaultProps: {
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
    listType: "text",
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "action",
      label: "上传地址",
      type: "input",
    },
    {
      name: "listType",
      label: "列表类型",
      type: "select",
      options: ["text", "picture", "picture-card"],
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
