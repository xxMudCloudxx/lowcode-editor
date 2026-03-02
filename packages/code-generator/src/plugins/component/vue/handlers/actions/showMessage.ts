/**
 * @file Vue 显示提示信息 Action 处理器
 * @description 使用 ant-design-vue 的 message 组件生成提示调用代码。
 */

import type { IVueActionHandler } from "./type";

export const showMessageActionHandler: IVueActionHandler = (
  action,
  moduleBuilder,
) => {
  moduleBuilder.addImport(
    {
      package: "ant-design-vue",
      destructuring: true,
      exportName: "message",
    },
    "message",
  );

  return `message.${action.config.type || "info"}('${action.config.text || ""}');`;
};
