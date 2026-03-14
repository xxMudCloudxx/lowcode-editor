/**
 * @file 跳转链接 Action 处理器（框架无关）
 * @description 将 schema 中配置的 URL 转换为 window.open 调用，用于在新标签页中打开链接。
 */

import type { IActionHandler } from "./type";

/**
 * 生成跳转链接的调用代码。
 * @param action - 当前 IRAction，其中 `config.url` 为要打开的地址
 * @returns `window.open` 调用代码字符串
 */
export const goToLinkHandler: IActionHandler = (action, moduleBuilder) => {
  moduleBuilder.addImport(
    {
      package: "../../runtime/actions",
      destructuring: true,
      exportName: "runAction",
    },
    "runAction",
  );

  const url = JSON.stringify(action.config.url || "");
  const target = JSON.stringify(action.config.target || "_blank");
  return `runAction(
    'goToLink',
    {
      url: ${url},
      target: ${target},
    },
    { message }
  );`;
};
