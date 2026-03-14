import type { Component, IGeneratedFile } from "@lowcode/schema";
import type {
  CodegenWorkerRequest,
  CodegenWorkerResponse,
  CodegenWorkerStats,
} from "../workers/codegenWorkerProtocol";

/**
 * 可测试的 worker 抽象，便于在单元测试中注入 mock。
 */
export interface CodegenWorkerLike {
  onmessage: ((event: MessageEvent<CodegenWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: CodegenWorkerRequest) => void;
  terminate: () => void;
}

interface PendingRequest {
  resolve: (result: GenerateCodeWithWorkerResult) => void;
  reject: (error: Error) => void;
}

/**
 * Worker 出码请求参数。
 */
export interface GenerateCodeWithWorkerPayload {
  components: Record<number, Component>;
  rootId: number;
  solution: string;
}

/**
 * Worker 出码结果。
 */
export interface GenerateCodeWithWorkerResult {
  files: IGeneratedFile[];
  stats: CodegenWorkerStats;
}

/**
 * 过期请求取消错误。
 */
export class CodegenCancelledError extends Error {
  constructor(message: string = "已取消过期的出码请求") {
    super(message);
    this.name = "CodegenCancelledError";
  }
}

/**
 * 判断错误是否为出码取消。
 *
 * @param error 未知错误对象。
 * @returns 是否为取消错误。
 */
export function isCodegenCancelledError(error: unknown): boolean {
  return error instanceof CodegenCancelledError;
}

/**
 * 创建默认的 codegen worker。
 *
 * @returns 浏览器 worker 实例。
 */
export function createCodegenWorker(): CodegenWorkerLike {
  return new Worker(new URL("../workers/codegen.worker.ts", import.meta.url), {
    type: "module",
  });
}

/**
 * 将未知错误转换为统一 Error 实例。
 *
 * @param error 未知错误。
 * @returns 标准 Error。
 */
function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

/**
 * 主线程的出码 worker 客户端。
 */
export class CodegenWorkerClient {
  private worker: CodegenWorkerLike | null;
  private readonly pendingRequests = new Map<number, PendingRequest>();
  private requestId = 0;

  constructor(createWorker: () => CodegenWorkerLike = createCodegenWorker) {
    this.createWorker = createWorker;
    this.worker = this.createAndBindWorker();
  }

  private readonly createWorker: () => CodegenWorkerLike;

  /**
   * 发起一次出码请求。
   *
   * @param payload 出码输入。
   * @returns 生成文件列表。
   */
  generateCode(
    payload: GenerateCodeWithWorkerPayload,
  ): Promise<GenerateCodeWithWorkerResult> {
    const requestId = ++this.requestId;

    if (this.pendingRequests.size > 0) {
      this.restartWorker(new CodegenCancelledError());
    }

    const worker = this.ensureWorker();

    return new Promise<GenerateCodeWithWorkerResult>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      worker.postMessage({
        type: "generate",
        requestId,
        payload,
      });
    });
  }

  /**
   * 销毁 worker，并拒绝所有未完成请求。
   */
  dispose() {
    this.disposeWorker();
    this.rejectAll(new CodegenCancelledError("出码 worker 已销毁"));
  }

  /**
   * 处理 worker 返回的结果。
   *
   * @param event worker message 事件。
   */
  private handleMessage = (event: MessageEvent<CodegenWorkerResponse>) => {
    const { data } = event;
    const pendingRequest = this.pendingRequests.get(data.requestId);

    if (!pendingRequest || data.type !== "result") {
      return;
    }

    this.pendingRequests.delete(data.requestId);

    if (data.success && data.files) {
      pendingRequest.resolve({
        files: data.files,
        stats: data.stats,
      });
      return;
    }

    pendingRequest.reject(new Error(data.error ?? "出码失败"));
  };

  /**
   * 处理 worker 运行时错误。
   *
   * @param event worker error 事件。
   */
  private handleError = (event: ErrorEvent) => {
    const error = new Error(event.message || "出码 worker 执行失败");
    this.disposeWorker();
    this.rejectAll(error);
  };

  /**
   * 创建并绑定事件处理器。
   *
   * @returns 已绑定事件的 worker。
   */
  private createAndBindWorker(): CodegenWorkerLike {
    const worker = this.createWorker();
    worker.onmessage = this.handleMessage;
    worker.onerror = this.handleError;
    return worker;
  }

  /**
   * 确保当前存在可用 worker。
   *
   * @returns 可用 worker 实例。
   */
  private ensureWorker(): CodegenWorkerLike {
    if (!this.worker) {
      this.worker = this.createAndBindWorker();
    }

    return this.worker;
  }

  /**
   * 取消挂起请求并为后续请求重启 worker。
   *
   * @param error 需要通知给挂起请求的错误。
   */
  private restartWorker(error: Error) {
    this.disposeWorker();
    this.rejectAll(error);
    this.worker = this.createAndBindWorker();
  }

  /**
   * 销毁当前 worker，但不自动重建。
   */
  private disposeWorker() {
    if (!this.worker) {
      return;
    }

    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.worker = null;
  }

  /**
   * 拒绝所有等待中的请求。
   *
   * @param error 要抛出的错误。
   */
  private rejectAll(error: Error) {
    const normalizedError = toError(error);

    for (const pendingRequest of this.pendingRequests.values()) {
      pendingRequest.reject(normalizedError);
    }

    this.pendingRequests.clear();
  }
}
