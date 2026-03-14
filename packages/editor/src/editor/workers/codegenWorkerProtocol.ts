import type { Component, IGeneratedFile } from "@lowcode/schema";

/**
 * 单次出码的关键指标。
 */
export interface CodegenWorkerStats {
  durationMs: number;
  treeBuildMs: number;
  schemaNodeCount: number;
  fileCount: number;
}

/**
 * 出码 worker 请求体。
 */
export interface CodegenWorkerRequest {
  type: "generate";
  requestId: number;
  payload: {
    components: Record<number, Component>;
    rootId: number;
    solution: string;
  };
}

/**
 * 出码 worker 响应体。
 */
export interface CodegenWorkerResponse {
  type: "result";
  requestId: number;
  success: boolean;
  files?: IGeneratedFile[];
  error?: string;
  stats: CodegenWorkerStats;
}
