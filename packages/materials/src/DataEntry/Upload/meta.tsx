/**
 * @file Upload/meta.tsx
 * @description Upload 组件协议配置
 */
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const UploadProtocol: ComponentProtocol = {
  name: "Upload",
  desc: "上传",
  category: "数据录入",

  component: lazy(() => import("./index")),
  defaultProps: {
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
    listType: "text",
  },

  editor: {
    isContainer: false,
    parentTypes: PT_GENERAL,
    interactiveInEditor: false,
    display: "inline-block",
  },

  setter: [
    { name: "action", label: "上传地址", type: "input" },
    {
      name: "listType",
      label: "列表类型",
      type: "select",
      options: ["text", "picture", "picture-card"],
    },
  ],
};

export default UploadProtocol;
