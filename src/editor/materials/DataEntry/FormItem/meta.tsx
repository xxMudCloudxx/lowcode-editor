import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "FormItem",
  desc: "表单项",
  category: "数据录入",
  defaultProps: {
    name: new Date().getTime(),
    label: "姓名",
  },
  setter: [
    {
      name: "type",
      label: "类型",
      type: "select",
      options: [
        {
          label: "文本",
          value: "input",
        },
        {
          label: "日期",
          value: "date",
        },
      ],
    },
    {
      name: "label",
      label: "标题",
      type: "input",
    },
    {
      name: "name",
      label: "字段",
      type: "input",
    },
    {
      name: "rules",
      label: "校验",
      type: "select",
      options: [
        {
          label: "必填",
          value: "required",
        },
      ],
    },
  ],
  // 表单项只能被放置在“表单”组件中
  parentTypes: ["Form"],
} as Omit<ComponentConfig, "dev" | "prod">;
