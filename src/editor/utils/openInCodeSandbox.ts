// src/code-generator/utils/openInCodeSandbox.ts

import { getParameters } from "codesandbox/lib/api/define";
import type { IGeneratedFile } from "../../code-generator/types/ir";

/**
 * 调用 CodeSandbox Define API 在新窗口中打开项目
 * @param files - ProjectBuilder 生成的虚拟文件列表
 */
export async function openInCodeSandbox(
  files: IGeneratedFile[]
): Promise<void> {
  // 1. 将 IGeneratedFile[] 转换为 CodeSandbox API 所需的格式
  // 格式: { 'package.json': { content: '...', isBinary: false }, ... }
  const filesForApi = Object.fromEntries(
    files.map((file) => [
      file.filePath,
      {
        content: file.content,
        isBinary: false,
      },
    ])
  );

  // 2. 使用 'codesandbox' 库将文件对象压缩为 URL 参数
  // 这里的 'parameters' 是一个变量名，'getParameters' 是我们导入的函数
  const parameters = getParameters({ files: filesForApi });

  // 3. 创建一个隐藏表单并以 POST 方式提交
  // 这是 CodeSandbox API 的标准用法，可以绕过 GET 请求的 URL 长度限制
  const form = document.createElement("form");
  form.action = "https://codesandbox.io/api/v1/sandboxes/define";
  form.method = "POST";
  form.target = "_blank"; // 在新标签页中打开

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "parameters";
  input.value = parameters;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
