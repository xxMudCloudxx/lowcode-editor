// src/code-generator/plugins/component/react/handlers/action/showMessage.ts
import type { IActionHandler } from "./type";

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
