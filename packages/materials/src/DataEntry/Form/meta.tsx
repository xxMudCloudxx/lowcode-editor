/**
 * @file Form/meta.tsx
 * @description Form 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_DATA } from "../../containerTypes";

const FormProtocol: ComponentProtocol = {
  name: "Form",
  desc: "表单",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {},

  editor: {
    isContainer: true,
    parentTypes: PT_DATA,
    interactiveInEditor: false,
    display: "block",
  },

  setter: [{ name: "title", label: "标题", type: "input" }],

  events: [{ name: "onFinish", label: "提交事件" }],

  methods: [{ name: "submit", label: "提交" }],
};

export default FormProtocol;
