/**
 * @file 发布器类型定义
 * @description 定义出码发布器接口及其选项，支持多种产出类型（Blob/文件列表/URL）。
 */

import type { IGeneratedFile } from "./ir";

/**
 * 发布器选项
 */
export interface IPublisherOptions {
  /**
   * 项目名称，将用作 ZIP 包内的根目录名
   */
  projectName: string;
}

/**
 * 发布结果
 * @description 支持多种产出类型，由 publisher 实现决定返回哪种。
 */
export interface IPublishResult {
  /** 产出类型 */
  type: "blob" | "files" | "url";
  /** ZIP/二进制 Blob 产物 */
  blob?: Blob;
  /** 内存中的文件列表（用于 CodeSandbox 等场景） */
  files?: IGeneratedFile[];
  /** 在线预览 URL */
  url?: string;
}

/**
 * 发布器接口
 * @description 对象形式的发布器，支持多种产出类型。
 */
export interface IPublisher {
  /** 发布器名称 */
  name: string;
  /**
   * 执行发布
   * @param files - ProjectBuilder 生成的虚拟文件列表
   * @param options - 发布器选项
   * @returns 包含最终产物的 Promise
   */
  publish(
    files: IGeneratedFile[],
    options: IPublisherOptions,
  ): Promise<IPublishResult>;
}
