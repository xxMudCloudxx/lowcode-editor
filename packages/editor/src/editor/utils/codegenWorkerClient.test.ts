import { describe, expect, it } from "vitest";
import type { Component, IGeneratedFile } from "@lowcode/schema";
import {
  CodegenCancelledError,
  CodegenWorkerClient,
  type CodegenWorkerLike,
  type GenerateCodeWithWorkerResult,
} from "./codegenWorkerClient";
import type {
  CodegenWorkerRequest,
  CodegenWorkerResponse,
  CodegenWorkerStats,
} from "../workers/codegenWorkerProtocol";

class MockCodegenWorker implements CodegenWorkerLike {
  onmessage: ((event: MessageEvent<CodegenWorkerResponse>) => void) | null =
    null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  lastMessage: CodegenWorkerRequest | null = null;
  terminated = false;

  postMessage(message: CodegenWorkerRequest) {
    this.lastMessage = message;
  }

  terminate() {
    this.terminated = true;
  }

  emitMessage(message: CodegenWorkerResponse) {
    this.onmessage?.({ data: message } as MessageEvent<CodegenWorkerResponse>);
  }

  emitError(message: string) {
    this.onerror?.(new ErrorEvent("error", { message }));
  }
}

describe("CodegenWorkerClient", () => {
  const defaultStats: CodegenWorkerStats = {
    durationMs: 120,
    treeBuildMs: 12,
    schemaNodeCount: 56,
    fileCount: 1,
  };

  const defaultComponents: Record<number, Component> = {
    1: {
      id: 1,
      name: "Page",
      props: {},
      desc: "页面",
      parentId: null,
      children: [],
    },
  };

  it("应在 worker 成功返回后解析文件列表", async () => {
    const worker = new MockCodegenWorker();
    const client = new CodegenWorkerClient(() => worker);
    const files = [
      {
        fileName: "App.tsx",
        filePath: "src/App.tsx",
        content: "export default function App() { return null; }",
        fileType: "tsx",
      },
    ] as IGeneratedFile[];

    const promise = client.generateCode({
      components: defaultComponents,
      rootId: 1,
      solution: "react-vite",
    });

    expect(worker.lastMessage?.type).toBe("generate");
    worker.emitMessage({
      type: "result",
      requestId: worker.lastMessage!.requestId,
      success: true,
      files,
      stats: defaultStats,
    });

    await expect(promise).resolves.toEqual({
      files,
      stats: defaultStats,
    });
    client.dispose();
  });

  it("应在 worker 返回失败时抛出错误", async () => {
    const worker = new MockCodegenWorker();
    const client = new CodegenWorkerClient(() => worker);

    const promise = client.generateCode({
      components: defaultComponents,
      rootId: 1,
      solution: "react-vite",
    });

    worker.emitMessage({
      type: "result",
      requestId: worker.lastMessage!.requestId,
      success: false,
      error: "生成失败",
      stats: { ...defaultStats, fileCount: 0 },
    });

    await expect(promise).rejects.toThrow("生成失败");
    client.dispose();
  });

  it("应在新请求到来时取消旧请求并重建 worker", async () => {
    const firstWorker = new MockCodegenWorker();
    const secondWorker = new MockCodegenWorker();
    const client = new CodegenWorkerClient(() => {
      return firstWorker.lastMessage ? secondWorker : firstWorker;
    });

    const firstPromise = client.generateCode({
      components: defaultComponents,
      rootId: 1,
      solution: "react-vite",
    });

    const secondPromise = client.generateCode({
      components: defaultComponents,
      rootId: 1,
      solution: "vue-vite",
    });

    await expect(firstPromise).rejects.toBeInstanceOf(CodegenCancelledError);
    expect(firstWorker.terminated).toBe(true);

    secondWorker.emitMessage({
      type: "result",
      requestId: secondWorker.lastMessage!.requestId,
      success: true,
      files: [],
      stats: { ...defaultStats, fileCount: 0 },
    });

    await expect(secondPromise).resolves.toEqual({
      files: [],
      stats: { ...defaultStats, fileCount: 0 },
    });
    client.dispose();
  });

  it("应在 worker 运行时错误后等待下一次请求再重建 worker", async () => {
    const firstWorker = new MockCodegenWorker();
    const secondWorker = new MockCodegenWorker();
    let createCount = 0;
    const client = new CodegenWorkerClient(() => {
      createCount += 1;
      return createCount === 1 ? firstWorker : secondWorker;
    });

    const firstPromise = client.generateCode({
      components: defaultComponents,
      rootId: 1,
      solution: "react-vite",
    });

    firstWorker.emitError("worker 崩溃");

    await expect(firstPromise).rejects.toThrow("worker 崩溃");
    expect(firstWorker.terminated).toBe(true);
    expect(createCount).toBe(1);

    const secondPromise = client.generateCode({
      components: defaultComponents,
      rootId: 1,
      solution: "react-vite",
    });

    expect(createCount).toBe(2);
    expect(secondWorker.lastMessage?.type).toBe("generate");

    secondWorker.emitMessage({
      type: "result",
      requestId: secondWorker.lastMessage!.requestId,
      success: true,
      files: [],
      stats: { ...defaultStats, fileCount: 0 },
    });

    await expect(secondPromise).resolves.toEqual({
      files: [],
      stats: { ...defaultStats, fileCount: 0 },
    });
    client.dispose();
  });
});
