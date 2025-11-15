// src/code-generator/types/publisher.ts

/**
 * @file 发布器类型定义
 * @description 定义出码发布器接口及其选项，用于约束不同发布实现的输入与输出。
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
 * 发布器接口
 *
 * @param files - ProjectBuilder 生成的虚拟文件列表
 * @param options - 发布器选项
 * @returns 返回一个包含最终产物（例如 ZIP 文件的 Blob）的 Promise
 */
export interface IPublisher {
  (files: IGeneratedFile[], options: IPublisherOptions): Promise<Blob>;
}
