/**
 * @file ZIP 发布器
 * @description 使用 JSZip 将虚拟文件列表打包为 ZIP Blob，作为代码导出的最终产物。
 *              实现 IPublisher 对象接口。
 */

import JSZip from "jszip";
import type {
  IGeneratedFile,
  IPublisher,
  IPublisherOptions,
  IPublishResult,
} from "@lowcode/schema";

/**
 * ZIP 发布器
 *
 * 参照 alibaba/lowcode-engine (modules/code-generator/src/publisher/zip/index.ts)
 * 接收文件数组，打包为 ZIP Blob。
 */
export const zipPublisher: IPublisher = {
  name: "zip",

  async publish(
    files: IGeneratedFile[],
    options: IPublisherOptions,
  ): Promise<IPublishResult> {
    const { projectName = "lowcode-project" } = options;
    const zip = new JSZip();

    // 1. 创建一个以项目名为根目录的文件夹
    const projectFolder = zip.folder(projectName);

    if (!projectFolder) {
      throw new Error(`[Publisher] 无法创建 ZIP 文件夹: ${projectName}`);
    }

    // 2. 遍历所有生成的文件，并将它们添加到 ZIP 中
    files.forEach((file) => {
      projectFolder.file(file.filePath, file.content);
    });

    // 3. 异步生成 ZIP blob 内容
    console.log("[Publisher] 正在生成 ZIP 文件...");

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });

    console.log("[Publisher] ZIP 文件生成完毕。");

    return {
      type: "blob",
      blob: zipBlob,
    };
  },
};
