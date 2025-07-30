// src/editor/materials/General/Icon/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Icon",
  desc: "图标",
  category: "基础",
  defaultProps: {
    icon: "HomeOutlined",
    spin: false,
    rotate: 0,
  },
  // 可以被放置在绝大多数容器中
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "icon",
      label: "选择图标",
      type: "select",
      options: [
        { label: "主页", value: "HomeOutlined" },
        { label: "设置", value: "SettingOutlined" },
        { label: "用户", value: "UserOutlined" },
        { label: "搜索", value: "SearchOutlined" },
        { label: "加载中", value: "LoadingOutlined" },
        { label: "成功", value: "CheckCircleOutlined" },
        { label: "错误", value: "CloseCircleOutlined" },
      ],
    },
    {
      name: "spin",
      label: "旋转动画",
      type: "switch",
    },
    {
      name: "rotate",
      label: "旋转角度",
      type: "inputNumber",
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
