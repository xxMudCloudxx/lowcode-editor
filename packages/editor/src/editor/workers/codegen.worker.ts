/// <reference lib="webworker" />

import { exportSourceCode } from "@lowcode/code-generator";
import type { ISchema, ISchemaNode } from "@lowcode/schema";
import { antdCodeGenPack } from "@lowcode/materials/codegen";
import type {
  CodegenWorkerRequest,
  CodegenWorkerResponse,
  CodegenWorkerStats,
} from "./codegenWorkerProtocol";
import { buildComponentTree } from "../utils/componentTree";

/**
 * 统一提取可展示的错误信息。
 *
 * @param error 未知错误对象。
 * @returns 适合展示的错误消息。
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * 向主线程回传出码结果。
 *
 * @param message worker 响应消息。
 */
function postResult(message: CodegenWorkerResponse) {
  self.postMessage(message);
}

/**
 * 递归统计 schema 节点总数。
 *
 * @param schema schema 树。
 * @returns 节点数量。
 */
function countSchemaNodes(schema: ISchema): number {
  const countNode = (node: ISchemaNode): number => {
    const childrenCount = Array.isArray(node.children)
      ? node.children.reduce((total, child) => total + countNode(child), 0)
      : 0;

    return 1 + childrenCount;
  };

  return schema.reduce((total, node) => total + countNode(node), 0);
}

self.onmessage = async (event: MessageEvent<CodegenWorkerRequest>) => {
  const { data } = event;

  if (data.type !== "generate") {
    return;
  }

  const startedAt = performance.now();
  const treeBuildStartedAt = performance.now();
  const schema = buildComponentTree(
    data.payload.components,
    data.payload.rootId,
  ) as ISchema;
  const treeBuildMs = Math.round(performance.now() - treeBuildStartedAt);
  const schemaNodeCount = countSchemaNodes(schema);

  try {
    const result = await exportSourceCode(schema, {
      solution: data.payload.solution,
      materialPack: antdCodeGenPack,
      skipPublisher: true,
    });
    const stats: CodegenWorkerStats = {
      durationMs: Math.round(performance.now() - startedAt),
      treeBuildMs,
      schemaNodeCount,
      fileCount: result.files?.length ?? 0,
    };

    if (result.success && result.files) {
      postResult({
        type: "result",
        requestId: data.requestId,
        success: true,
        files: result.files,
        stats,
      });
      return;
    }

    postResult({
      type: "result",
      requestId: data.requestId,
      success: false,
      error: result.message ?? "出码失败",
      stats,
    });
  } catch (error) {
    postResult({
      type: "result",
      requestId: data.requestId,
      success: false,
      error: getErrorMessage(error),
      stats: {
        durationMs: Math.round(performance.now() - startedAt),
        treeBuildMs,
        schemaNodeCount,
        fileCount: 0,
      },
    });
  }
};
