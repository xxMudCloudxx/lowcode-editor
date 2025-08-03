import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "Modal",
  category: "反馈",
  desc: "弹窗",
  defaultProps: {
    title: "弹窗",
    // 默认在编辑器中可见
    visibleInEditor: true,
  },
  setter: [
    {
      name: "title",
      label: "标题",
      type: "input",
    },
    {
      name: "visibleInEditor",
      label: "可见",
      type: "switch",
    },
  ],
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
  parentTypes: ["Page"],
} as Omit<ComponentConfig, "dev" | "prod">;
