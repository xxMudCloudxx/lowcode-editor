/**
 * @file 显示提示信息的 Action 处理器工厂（框架无关）
 * @description 根据传入的 UI 库包名（如 antd / ant-design-vue），
 *              生成对应 message 组件的调用代码。
 */

import type { IActionHandler } from "./type";

/**
 * 创建 showMessage Action 处理器
 * @param uiPackage - UI 组件库包名，如 "antd" (React) 或 "ant-design-vue" (Vue)
 */
export function createShowMessageHandler(uiPackage: string): IActionHandler {
  return (action, moduleBuilder) => {
    moduleBuilder.addImport(
      {
        package: uiPackage,
        destructuring: true,
        exportName: "message",
      },
      "message",
    );

    return `message.${action.config.type || "info"}('${
      action.config.text || ""
    }');`;
  };
}
