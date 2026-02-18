import {
  getParameters,
  type IFiles,
} from "codesandbox-import-utils/lib/api/define";
import type { IGeneratedFile } from "@lowcode/schema";

/**
 * 辅助函数：动态创建并提交表单到 CodeSandbox
 * 这是 CodeSandbox 官方推荐的公开 API 使用方式
 * @param parameters 经过 getParameters 压缩后的文件参数
 */
const postToCodeSandbox = (parameters: string) => {
  // 1. 创建一个表单
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://codesandbox.io/api/v1/sandboxes/define";
  form.target = "_blank"; // 在新标签页中打开
  form.style.display = "none"; // 隐藏表单

  // 2. 创建一个隐藏的 input 来存放参数
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "parameters"; // API 要求参数字段名为 'parameters'
  input.value = parameters;

  // 3. 提交表单
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();

  // 4. 移除表单
  document.body.removeChild(form);
};

export const openInCodeSandbox = async (files: IGeneratedFile[]) => {
  const filesMap: Record<
    string,
    { content: string | Record<string, unknown>; isBinary?: boolean }
  > = {};

  files.forEach((file) => {
    // CodeSandbox 需要以 '/' 开头的绝对路径
    const filePath = file.filePath.startsWith("/")
      ? file.filePath
      : `/${file.filePath}`;

    // 特殊处理 package.json，它必须是 JSON 对象，而不是字符串
    if (file.fileName === "package.json") {
      try {
        filesMap[filePath] = {
          content: JSON.parse(file.content),
        };
      } catch (e) {
        console.error("Failed to parse package.json, sending as string", e);
        filesMap[filePath] = {
          content: file.content,
        };
      }
    } else {
      filesMap[filePath] = {
        content: file.content,
      };
    }
  });

  // 1. 使用官方工具包生成参数
  const parameters = getParameters({
    files: filesMap as IFiles,
    template: "create-react-app-typescript",
  } as any);

  // 2. 使用动态表单 POST 提交到公开 API
  postToCodeSandbox(parameters);

  // 3. 立即返回，因为表单提交会打开新页面
  return Promise.resolve();
};
