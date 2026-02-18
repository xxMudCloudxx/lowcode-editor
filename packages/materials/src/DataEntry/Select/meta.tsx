/**
 * @file Select/meta.tsx
 * @description Select 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const SelectProtocol: ComponentProtocol = {
  name: "Select",
  desc: "选择器",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    options: [
      { value: "jack", label: "Jack" },
      { value: "lucy", label: "Lucy" },
      { value: "Yiminghe", label: "yiminghe" },
    ],
    style: { width: "100px" },
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
  ],
};

export default SelectProtocol;
