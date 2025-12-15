/**
 * @file Page/meta.tsx
 * @description Page 组件协议配置
 *
 * Page 是组件树的根节点，只能有一个实例。
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../types/component-protocol";

const PageProtocol: ComponentProtocol = {
  name: "Page",
  desc: "页面",
  category: "布局",

  component: lazy(() => import("./index")),
  defaultProps: {
    // 画布配置 - 协同同步
    // width: 初始默认值，会在 EditArea 中根据容器/内容宽度动态更新
    // height: 已移除，画布高度由内容撑开（动态高度）
    canvasConfig: {
      width: 1920,
      mode: "desktop" as const,
    },
  },

  editor: {
    isContainer: true,
    // Page 没有父组件，它是根
  },
};

export default PageProtocol;
