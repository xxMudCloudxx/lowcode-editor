/**
 * @file Icon/meta.tsx
 * @description Icon 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_GENERAL } from "../../containerTypes";

const IconProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Icon",
  desc: "图标",
  category: "基础",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {
    icon: "HomeOutlined",
    spin: false,
    rotate: 0,
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline",
  },

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
        { label: "刷新", value: "ReloadOutlined" },
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
};

export default IconProtocol;

