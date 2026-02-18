// src/code-generator/plugins/component/react/handlers/action/showMessage.ts

/**
 * @file 显示提示信息的 Action 处理器
 * @description 使用 antd 的 message 组件，将 schema 中配置的提示内容转换为可执行的提示调用代码。
 */

import type { IActionHandler } from "./type";

/**
 * 生成调用 antd `message` 组件的代码。
 * @param action - 当前 IRAction，`config.type` / `config.text` 分别对应提示类型和文案
 * @param moduleBuilder - 用于注册 `message` 依赖的 ModuleBuilder 实例
 * @returns 一行调用 `message.xxx('text')` 的代码字符串
 */
export const showMessageActionHandler: IActionHandler = (
  action,
  moduleBuilder
) => {
  // 我们需要一个 message 依赖
  moduleBuilder.addImport(
    {
      package: "antd",
      destructuring: true,
      exportName: "message",
    },
    "message"
  );

  // 返回核心调用代码
  return `message.${action.config.type || "info"}('${
    action.config.text || ""
  }');`;
};
