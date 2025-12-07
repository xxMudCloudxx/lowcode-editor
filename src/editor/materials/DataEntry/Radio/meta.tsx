/**
 * @file Radio/meta.tsx
 * @description Radio 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const RadioProtocol: ComponentProtocol = {
  name: "Radio",
  desc: "单选框",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    options: [
      { label: "选项A", value: "A" },
      { label: "选项B", value: "B" },
      { label: "选项C", value: "C" },
    ],
    optionType: "default",
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    {
      name: "options",
      label: "选项",
      type: "custom",
      component: "AttrListSetter",
      props: {
        itemProps: [
          { name: "label", label: "标签" },
          { name: "value", label: "值" },
        ],
        defaultItem: { label: "新选项", value: "new-option" },
      },
    },
    {
      name: "direction",
      label: "排列方向",
      type: "radio",
      options: ["horizontal", "vertical"],
    },
    {
      name: "optionType",
      label: "类型",
      type: "radio",
      options: [
        { label: "默认", value: "default" },
        { label: "按钮", value: "button" },
      ],
    },
    {
      name: "buttonStyle",
      label: "按钮风格",
      type: "radio",
      options: [
        { label: "描边", value: "outline" },
        { label: "填色", value: "solid" },
      ],
    },
    { name: "disabled", label: "禁用", type: "switch" },
  ],
};

export default RadioProtocol;
