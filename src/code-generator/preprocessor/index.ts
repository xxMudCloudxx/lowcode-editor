// src/code-generator/preprocessor/index.ts

import type { IRProject } from "../types/ir";
import { runStateLifter } from "./state-lifter";
// import { runDataSourceTransformer } from './datasource-transformer'; // 示例：未来可以添加更多

/**
 * IR 预处理器流水线
 * 负责对 Parser 输出的 IRProject 进行“再加工”，
 * 为后续的 Plugins 阶段做好准备。
 */
export function runPreprocessors(irProject: IRProject): IRProject {
  let transformedIR = irProject;

  // 预处理器1: 状态提升
  transformedIR = runStateLifter(transformedIR);

  // 预处理器2: (示例) 处理数据源
  // transformedIR = runDataSourceTransformer(transformedIR);

  // ...

  return transformedIR;
}
