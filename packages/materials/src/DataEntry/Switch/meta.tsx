/**
 * @file Switch/meta.tsx
 * @description Switch 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const SwitchProtocol: ComponentProtocol = {
  name: "Switch",
  desc: "开关",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    defaultChecked: false,
    disabled: false,
    loading: false,
    size: "default",
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    { name: "defaultChecked", label: "默认选中", type: "switch" },
    { name: "disabled", label: "禁用", type: "switch" },
    { name: "loading", label: "加载中", type: "switch" },
    {
      name: "size",
      label: "尺寸",
      type: "radio",
      options: ["default", "small"],
    },
    { name: "checkedChildren", label: "选中时内容", type: "input" },
    { name: "unCheckedChildren", label: "非选中内容", type: "input" },
  ],
};

export default SwitchProtocol;
