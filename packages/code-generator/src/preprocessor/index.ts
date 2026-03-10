// src/code-generator/preprocessor/index.ts

/**
 * @file IR 预处理器
 * @description 导出预处理器实例，供 Solution 的 preprocessors 字段使用。
 */

export { runStateLifter, stateLifterPreprocessor } from "./state-lifter";
