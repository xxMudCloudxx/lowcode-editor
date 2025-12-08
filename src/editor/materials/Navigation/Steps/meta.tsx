/**
 * @file Steps/meta.tsx
 * @description Steps 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const StepsProtocol: ComponentProtocol = {
  name: "Steps",
  desc: "步骤条",
  category: "导航",

  component: lazy(() => import("./index")),
  defaultProps: {
    current: 0,
    items: [
      { title: "第一步", description: "这是描述" },
      { title: "第二步", description: "这是描述" },
      { title: "第三步", description: "这是描述" },
    ],
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
  },

  setter: [
    {
      name: "current",
      label: "当前步骤",
      type: "inputNumber",
    },
    {
      name: "items",
      label: "步骤配置",
      type: "custom",
      component: "AttrListSetter",
      props: {
        itemProps: [
          { name: "title", label: "标题" },
          { name: "description", label: "描述" },
        ],
        defaultItem: {
          key: "new-step",
          title: "新步骤",
          description: "这是描述",
        },
      },
    },
  ],

  methods: [
    { name: "next", label: "下一步" },
    { name: "prev", label: "上一步" },
  ],
};

export default StepsProtocol;
