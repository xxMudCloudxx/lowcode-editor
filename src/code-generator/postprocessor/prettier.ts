// src/code-generator/postprocessor/prettier.ts

// 注意：这需要您在 lowcode-editor 项目中安装 prettier:
// npm install prettier --save-dev

import * as prettier from "prettier";
import type { IGeneratedFile } from "../types/ir";
import type { IPostProcessor } from "../types/plugin";

/**
 * Prettier 后处理器工厂函数
 *
 * @returns 一个后处理器函数，它使用 Prettier 格式化文件内容。
 */
export function prettierPostProcessor(): IPostProcessor {
  // 定义 Prettier 配置
  const prettierOptions: prettier.Options = {
    singleQuote: true,
    trailingComma: "es5", // 'all' 在某些老 JS parser 中可能不支持
    printWidth: 100,
    tabWidth: 2,
    semi: true,
  };

  return async (file: IGeneratedFile): Promise<IGeneratedFile> => {
    let parser: prettier.Options["parser"];

    // 根据文件类型推断 Prettier 解析器
    switch (file.fileType) {
      case "tsx":
      case "ts":
        parser = "typescript";
        break;
      case "js":
        parser = "babel";
        break;
      case "json":
        parser = "json";
        break;
      case "css":
        parser = "css";
        break;
      case "scss":
        parser = "scss";
        break;
      case "less":
        parser = "less";
        break;
      case "html":
        parser = "html";
        break;
      case "md":
        parser = "markdown";
        break;
      default:
        // 对于 'other' 或无法识别的类型，不进行格式化
        return file;
    }

    try {
      // 格式化文件内容
      const formattedContent = await prettier.format(file.content, {
        ...prettierOptions,
        parser: parser,
      });

      // 返回包含格式化内容的新文件对象
      return {
        ...file,
        content: formattedContent,
      };
    } catch (error: any) {
      console.warn(
        `[Prettier] 格式化文件失败 ${file.filePath}. Error: ${error.message}`
      );
      // 格式化失败时返回原文件
      return file;
    }
  };
}
