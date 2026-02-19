/**
 * @file Page/meta.tsx
 * @description Page 组件协议配置
 *
 * Page 是组件树的根节点，只能有一个实例。
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";

const PageProtocol: ComponentProtocol = {
  name: "Page",
  desc: "页面",
  category: "布局",

  component: lazy(() => import("./index")),
  defaultProps: {},

  editor: {
    isContainer: true,
    // Page 没有父组件，它是根
  },
};

export default PageProtocol;

