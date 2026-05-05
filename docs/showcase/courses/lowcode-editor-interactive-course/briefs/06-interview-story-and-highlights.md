## Teaching Arc

- Opening hook: “真正打动面试官的，不是你列了多少技术名词，而是你能不能把项目讲成‘问题 - 设计 - 取舍 - 收益’。”
- Metaphor: 像把一整部纪录片压缩成路演版。你不能什么都讲，但要把最值钱的桥段按顺序交代清楚。
- Why this matters in an interview: 这一模块负责把前五个模块压缩成一套可复述的表达模板，帮读者从“看懂项目”切换到“能讲项目”。

## Code Evidence

- `packages/editor/src/editor/components/Header/Header.tsx:154-188`

```tsx
  const generateCode = async (solutionName: string) => {
    const currentRequestId = ++latestGenerateRequestRef.current;
    const requestStartedAt = performance.now();
    setIsExporting(true);
    const { components, rootId } = useComponentsStore.getState();

    try {
      const result = await getWorkerClient().generateCode({
        components,
        rootId,
        solution: solutionName,
      });

      if (currentRequestId !== latestGenerateRequestRef.current) {
        return;
      }
```

- `packages/editor/src/editor/utils/codegenWorkerClient.ts:128-145`

```ts
    if (this.pendingRequests.size > 0) {
      this.restartWorker(new CodegenCancelledError());
    }

    const worker = this.ensureWorker();

    return new Promise<GenerateCodeWithWorkerResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (!this.pendingRequests.has(requestId)) {
          return;
        }

        this.restartWorker(
          new CodegenTimeoutError(
```

- `packages/editor/src/editor/simulator/SimulatorRenderer.ts:205-210`

```ts
    if (payload.baseVersion !== localVersion) {
      console.warn(
        `[SimulatorRenderer] Version mismatch: local=${localVersion}, base=${payload.baseVersion}. Requesting full snapshot.`,
      );
      this.requestFullSnapshot("version-mismatch");
      return;
    }
```

- `packages/code-generator/src/index.ts:180-188`

```ts
    // --- 1. Schema 鈫?IR ---
    const parser = new SchemaParser(registry);
    let irProject = parser.parse(schema);

    // --- 1.5 鎵ц Solution 棰勫鐞嗗櫒锛圛R鈫扞R 鍙樻崲锛?---
    if (solution.preprocessors) {
      for (const preprocessor of solution.preprocessors) {
        irProject = preprocessor.run(irProject, { registry });
      }
    }
```

## Interactive Elements

- Hero visual: “1 分钟面试答案”与“深入追问答案”双栏对照。
- Extra visual: 面试官群聊动画，角色是 `面试官`、`候选人`、`系统设计师视角`。
- Quiz type: scenario quiz，模拟面试官追问：
  - 为什么要用 iframe，而不是直接在主页面渲染？
  - 为什么要先转成 IR，而不是直接拼 React JSX？
  - 为什么 Web Worker 要做取消旧任务和超时重启？
- Code-to-English block target: `packages/editor/src/editor/utils/codegenWorkerClient.ts:128-145`。

## References To Load While Writing

- `interactive-elements.md`
  Focus: Scenario Quiz, Group Chat Animation, Callout Boxes.
- `content-philosophy.md`
  Focus: Quizzes That Test Application, Aha Callouts.

## Transition

- Previous module: 读者已经理解出码流水线。
- Next module: none, this is the final landing point and should close with一套可直接拿去面试表达的总结。
