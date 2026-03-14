/**
 * @file 自定义 JS Action 处理器（框架无关）
 * @description 将 schema 中配置的自定义代码转换为运行时可执行的函数调用。
 */

import type { IActionHandler } from "./type";

/**
 * 创建 customJs Action 处理器。
 * @param uiPackage - UI 组件库包名，如 "antd" 或 "ant-design-vue"
 */
export function createCustomJsHandler(uiPackage: string): IActionHandler {
  return (action, moduleBuilder, context) => {
    moduleBuilder.addImport(
      {
        package: "../../runtime/actions",
        destructuring: true,
        exportName: "runAction",
      },
      "runAction",
    );

    moduleBuilder.addImport(
      {
        package: uiPackage,
        destructuring: true,
        exportName: "message",
      },
      "message",
    );

    const code = JSON.stringify(String(action.config.code || ""));
    const componentName = JSON.stringify(context?.componentName || "");
    const componentPropsCode = context?.componentPropsCode || "{}";

    return `runAction(
      'customJs',
      {
        code: ${code},
        context: { name: ${componentName}, props: ${componentPropsCode} },
        args,
      },
      { message }
    );`;
  };
}
