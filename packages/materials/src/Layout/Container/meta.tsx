/**
 * @file Container/meta.tsx
 * @description Container 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "@lowcode/schema";
import { PT_LAYOUT } from "../../containerTypes";

const ContainerProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "Container",
  desc: "容器",
  category: "布局",

  // ===== 渲染层 =====
  component: lazy(() => import("./index")),
  defaultProps: {},

  // ===== 编辑层 =====
  editor: {
    isContainer: true, // 容器组件，可以接收子组件
    parentTypes: PT_LAYOUT,
    interactiveInEditor: false,
    display: "block",
  },
};

export default ContainerProtocol;

