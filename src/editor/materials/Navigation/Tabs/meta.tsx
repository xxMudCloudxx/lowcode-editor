/**
 * @file Tabs/meta.tsx
 * @description Tabs 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_LAYOUT } from "../../containerTypes";

const TabsProtocol: ComponentProtocol = {
  name: "Tabs",
  desc: "标签页",
  category: "导航",

  component: lazy(() => import("./index")),
  defaultProps: {
    type: "line",
    tabPosition: "top",
  },

  editor: {
    isContainer: true,
    parentTypes: PT_LAYOUT,
  },

  setter: [
    {
      name: "type",
      label: "页签类型",
      type: "select",
      options: [
        { label: "线形", value: "line" },
        { label: "卡片", value: "card" },
        { label: "可编辑卡片", value: "editable-card" },
      ],
    },
    {
      name: "tabPosition",
      label: "页签位置",
      type: "select",
      options: [
        { label: "上", value: "top" },
        { label: "下", value: "bottom" },
        { label: "左", value: "left" },
        { label: "右", value: "right" },
      ],
    },
    {
      name: "centered",
      label: "标签居中",
      type: "switch",
    },
  ],

  methods: [
    {
      name: "setActiveKey",
      label: "切换标签页",
      params: [
        {
          name: "key",
          label: "目标Key",
          type: "input",
        },
      ],
    },
  ],
};

export default TabsProtocol;
