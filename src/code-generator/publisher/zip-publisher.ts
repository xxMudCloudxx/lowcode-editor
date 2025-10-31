// src/code-generator/publisher/zip-publisher.ts

import JSZip from "jszip";
import type { IGeneratedFile } from "../types/ir";
import type { IPublisher, IPublisherOptions } from "../types/publisher";

/**
 * ZIP 发布器
 *
 * 参照 alibaba/lowcode-engine (modules/code-generator/src/publisher/zip/index.ts)
 * 接收文件数组，并返回一个包含 ZIP 压缩包的 Blob。
 */
export const zipPublisher: IPublisher = async (
  files: IGeneratedFile[],
  options: IPublisherOptions
): Promise<Blob> => {
  const { projectName = "lowcode-project" } = options;
  const zip = new JSZip();

  // 1. 创建一个以项目名为根目录的文件夹
  // 这参考了 lowcode-engine 的做法，避免将所有文件解压到根目录
  const projectFolder = zip.folder(projectName);

  if (!projectFolder) {
    // 理论上不会发生，除非项目名无效
    throw new Error(`[Publisher] 无法创建 ZIP 文件夹: ${projectName}`);
  }

  // 2. 遍历所有生成的文件，并将它们添加到 ZIP 中
  files.forEach((file) => {
    // file.filePath 已经是相对路径, e.g., "src/pages/Index/Index.tsx"
    // file.content 已经是格式化后的字符串
    projectFolder.file(file.filePath, file.content);
  });

  // 3. 异步生成 ZIP blob 内容
  console.log("[Publisher] 正在生成 ZIP 文件...");

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE", // 使用 DEFLATE 压缩
    compressionOptions: {
      level: 9, // 最大压缩级别
    },
  });

  console.log("[Publisher] ZIP 文件生成完毕。");
  return zipBlob;
};
