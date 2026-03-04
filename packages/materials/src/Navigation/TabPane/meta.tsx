/**
 * @file TabPane/meta.tsx
 * @description TabPane 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";

const TabPaneProtocol: ComponentProtocol = {
  name: "TabPane",
  desc: "标签项",
  category: "导航",

  component: lazy(() => import("./index")),
  defaultProps: {
    tab: "标签项",
  },

  editor: {
    isContainer: true,
    // TabPane 只能放在 Tabs 内
    parentTypes: ["Tabs"],
  },

  setter: [
    {
      name: "tab",
      label: "标签标题",
      type: "input",
    },
  ],

  // ===== 出码层 =====
  codegen: {
    dependency: {
      package: "antd",
      version: "^5.0.0",
      destructuring: true,
      exportName: "Tabs",
      subName: "TabPane",
    },
    isContainer: true,
  },
};

export default TabPaneProtocol;
