import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Modal",
  category: "反馈",
  defaultProps: {
    title: "弹窗",
  },
  setter: [
    {
      name: "title",
      label: "标题",
      type: "input",
    },
  ],
  stylesSetter: [],
  events: [
    {
      name: "onOk",
      label: "确认事件",
    },
    {
      name: "onCancel",
      label: "取消事件",
    },
  ],
  methods: [
    {
      name: "open",
      label: "打开弹窗",
    },
    {
      name: "close",
      label: "关闭弹窗",
    },
  ],
  desc: "弹窗",
  // 弹窗本身作为一个可拖拽的配置项，可以被放置在“页面”上
  parentTypes: ["Page"],
} as Omit<ComponentConfig, "dev" | "prod">;
