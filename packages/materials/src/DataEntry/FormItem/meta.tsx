/**
 * @file FormItem/meta.tsx
 * @description FormItem 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";

const FormItemProtocol: ComponentProtocol = {
  name: "FormItem",
  desc: "表单项",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    name: Date.now(),
    label: "姓名",
  },

  editor: {
    isContainer: true,
    parentTypes: ["Form"],
    interactiveInEditor: false,
    display: "block",
  },

  setter: [
    {
      name: "type",
      label: "类型",
      type: "select",
      options: [
        { label: "文本", value: "input" },
        { label: "日期", value: "date" },
      ],
    },
    { name: "label", label: "标题", type: "input" },
    { name: "name", label: "字段", type: "input" },
    {
      name: "rules",
      label: "校验",
      type: "select",
      options: [{ label: "必填", value: "required" }],
    },
  ],
};

export default FormItemProtocol;

