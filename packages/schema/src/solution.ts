/**
 * @file 出码方案核心类型定义
 * @description 定义可插拔多目标出码架构的核心抽象：ISolution、IProjectTemplate、ICodeChunk。
 */

import type { IGeneratedFile, IRDependency } from "./ir";
import type {
  IComponentPlugin,
  IProjectPlugin,
  IPostProcessor,
} from "./plugin";
import type { IPublisher } from "./publisher";

// --- Code Chunk ---

/**
 * 代码片段的插槽类型
 * 决定该 Chunk 在最终文件中的位置
 */
export type CodeChunkSlot =
  | "import"
  | "state"
  | "method"
  | "effect"
  | "jsx"
  | "style"
  | "type"
  | "template" // Vue SFC <template>
  | "script" // Vue SFC <script>
  | "custom"; // 自定义

/**
 * 插件产出的结构化代码片段
 * @description 取代直接操作 ModuleBuilder 的字符串拼接模式，
 *              为 Plugin 提供类型安全的结构化输出。
 */
export interface ICodeChunk {
  /** 片段类型，决定它在最终文件中的位置 */
  slot: CodeChunkSlot;
  /** 代码内容（仍然是字符串，但被分类了） */
  content: string;
  /** 该片段引入的依赖 */
  dependencies?: IRDependency[];
  /** 排序权重（同一 slot 内的顺序控制，数字越小越靠前） */
  weight?: number;
}

// --- Project Template ---

/**
 * 项目模板接口
 * @description 负责提供不依赖 IR 数据的静态脚手架文件（如 tsconfig.json, vite.config.ts 等）。
 */
export interface IProjectTemplate {
  /** 模板名称 */
  name: string;
  /** 返回所有静态脚手架文件 */
  getStaticFiles(): IGeneratedFile[];
}

// --- Solution ---

/**
 * 出码方案编排器接口
 * @description 一个 Solution 定义了一套完整的出码流水线，
 *              包括模板、组件插件、项目插件、后处理器和发布器。
 */
export interface ISolution {
  /** 方案名称（唯一标识） */
  name: string;
  /** 方案描述 */
  description: string;
  /** 框架模板（决定生成什么脚手架文件） */
  template: IProjectTemplate;
  /** 组件级插件流水线 */
  componentPlugins: IComponentPlugin[];
  /** 项目级插件流水线 */
  projectPlugins: IProjectPlugin[];
  /** 后处理器 */
  postProcessors: IPostProcessor[];
  /** 发布器 */
  publisher: IPublisher;
}
