import type { ComponentConfig } from "../../../stores/component-config";
import { PT_DATA } from "../../containerTypes";

export default {
  name: "Form",
  defaultProps: {},
  desc: "表单",
  category: "表单",
  setter: [
    {
      name: "title",
      label: "标题",
      type: "input",
    },
  ],
  events: [
    {
      name: "onFinish",
      label: "提交事件",
    },
  ],
  methods: [
    {
      name: "submit",
      label: "提交",
    },
  ],
  // 表单可以被放置在"页面"、"容器"或"弹窗"中
  parentTypes: PT_DATA,
} as Omit<ComponentConfig, "dev" | "prod">;
