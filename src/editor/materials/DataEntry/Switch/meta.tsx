import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Switch",
  desc: "开关", // 描述修正为 “开关”
  category: "数据录入",
  defaultProps: {
    defaultChecked: false,
    disabled: false,
    loading: false,
    size: "default",
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "defaultChecked",
      label: "默认选中",
      type: "switch",
    },
    {
      name: "disabled",
      label: "禁用",
      type: "switch",
    },
    {
      name: "loading",
      label: "加载中",
      type: "switch",
    },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["default", "small"],
    },
    {
      name: "checkedChildren",
      label: "选中时内容",
      type: "input",
    },
    {
      name: "unCheckedChildren",
      label: "非选中内容",
      type: "input",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
