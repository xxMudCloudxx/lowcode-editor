import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "TableColumn",
  desc: "表格列",
  category: "数据展示",
  defaultProps: {
    dataIndex: `col_${new Date().getTime()}`,
    title: "列名",
  },
  setter: [
    {
      name: "type",
      label: "类型",
      type: "select",
      options: [
        {
          label: "文本",
          value: "text",
        },
        {
          label: "日期",
          value: "date",
        },
      ],
    },
    {
      name: "title",
      label: "标题",
      type: "input",
    },
    {
      name: "dataIndex",
      label: "字段",
      type: "input",
    },
  ],
  // 表格列只能被放置在“表格”组件中
  parentTypes: ["Table"],
} as Omit<ComponentConfig, "dev" | "prod">;
