/**
 * @file Prettier 后处理器
 * @description 封装 Prettier v3 Standalone，在代码生成完成后对不同类型的文件内容进行格式化。
 */
// src/code-generator/postprocessor/prettier.ts
import * as prettier from "prettier/standalone"; //  Standalone 运行时
import type { Options } from "prettier"; // 导入类型
import parserBabel from "prettier/plugins/babel"; // 导入 Babel/TS 解析器
import parserPostCss from "prettier/plugins/postcss"; // 导入 CSS/SCSS 解析器
import parserHtml from "prettier/plugins/html"; // 导入 HTML 解析器
import parserEstree from "prettier/plugins/estree"; // 导入 Estree 打印机

import type { IGeneratedFile } from "../types/ir";
import type { IPostProcessor } from "../types/plugin";

/**
 * Prettier 后处理器工厂函数 (适配 Prettier v3 Standalone)
 */
export function prettierPostProcessor(): IPostProcessor {
  const prettierOptions: Options = {
    singleQuote: true,
    trailingComma: "es5",
    printWidth: 100,
    tabWidth: 2,
    semi: true,
  };

  //  将 'parserEstree' 添加到插件列表
  const prettierPlugins = [
    parserBabel,
    parserPostCss,
    parserHtml,
    parserEstree,
  ];

  return async (file: IGeneratedFile): Promise<IGeneratedFile> => {
    let parser: Options["parser"];

    // 根据文件类型推断 Prettier 解析器
    switch (file.fileType) {
      case "tsx":
      case "ts":
        parser = "babel-ts"; // 由 parserBabel 提供 (依赖 estree)
        break;
      case "js":
        parser = "babel"; // 由 parserBabel 提供 (依赖 estree)
        break;
      case "json":
        parser = "json"; // 由 parserBabel 提供 (依赖 estree)
        break;
      case "css":
        parser = "css"; // 由 parserPostCss 提供
        break;
      case "scss":
        parser = "scss"; // 由 parserPostCss 提供
        break;
      case "less":
        parser = "less"; // 由 parserPostCss 提供
        break;
      case "html":
        parser = "html"; // 由 parserHtml 提供
        break;
      case "md":
        parser = "markdown"; // Prettier v3 standalone 默认包含
        break;
      default:
        return file;
    }

    try {
      // 格式化文件内容
      const formattedContent = await prettier.format(file.content, {
        ...prettierOptions,
        parser: parser,
        plugins: prettierPlugins,
      });

      // 返回包含格式化内容的新文件对象
      return {
        ...file,
        content: formattedContent,
      };
    } catch (error: any) {
      console.warn(
        `[Prettier] 格式化文件失败 ${file.filePath}. Parser: ${parser}. Error: ${error.message}`
      );
      // 格式化失败时返回原文件
      return file;
    }
  };
}
