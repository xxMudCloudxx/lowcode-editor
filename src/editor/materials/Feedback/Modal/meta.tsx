/**
 * @file Modal/meta.tsx
 * @description Modal 组件协议配置
 *
 * Modal 是"双面组件"：
 * - 编辑态(component): 平铺 div 容器，方便用户拖拽子组件
 * - 运行态(runtimeComponent): 真正的 Antd Modal 弹窗
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";

const ModalProtocol: ComponentProtocol = {
  name: "Modal",
  desc: "弹窗",
  category: "反馈",

  // 编辑态：平铺容器
  component: lazy(() => import("./index")),
  // 运行态：真正的 Antd Modal
  runtimeComponent: lazy(() => import("./runtime")),

  defaultProps: {
    title: "弹窗",
    visibleInEditor: true,
  },

  editor: {
    isContainer: true,
    parentTypes: ["Page"],
  },

  setter: [
    {
      name: "title",
      label: "标题",
      type: "input",
    },
    {
      name: "visibleInEditor",
      label: "画布可见",
      type: "switch",
    },
  ],

  events: [
    { name: "onOk", label: "确认事件" },
    { name: "onCancel", label: "取消事件" },
  ],

  methods: [
    { name: "open", label: "打开弹窗" },
    { name: "close", label: "关闭弹窗" },
  ],
};

export default ModalProtocol;
