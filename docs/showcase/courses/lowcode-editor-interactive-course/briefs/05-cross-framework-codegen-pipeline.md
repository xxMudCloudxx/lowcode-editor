## Teaching Arc

- Opening hook: “这个项目最有面试含金量的点，不是能导出代码，而是它没有把出码写死成一条 React 专线，而是抽成了可切换 Solution 的主流程。”
- Metaphor: 像一个通用装配线。原材料先进入标准中间件接口，再根据不同订单切到 React 车间或 Vue 车间，最后统一打包发货。
- Why this matters in an interview: 这是你简历里第一组亮点的核心，要把 `Schema -> IR -> Solution -> Registry -> Plugin -> Worker` 这一整条线讲成“设计能力”，而不只是“写了个导出功能”。

## Code Evidence

- `packages/code-generator/src/index.ts:158-220`

```ts
export async function exportSourceCode(
  schema: ISchema,
  options: IExportOptions = {},
): Promise<IExportResult> {
  const {
    solution: solutionInput = "react-vite",
    materialPack,
    skipPublisher = false,
    projectName = "lowcode-project",
  } = options;

  try {
    const solution = resolveSolution(solutionInput);
    const registry = new CodeGenRegistry();
    if (materialPack) {
      registry.loadPack(materialPack);
    }
```

- `packages/code-generator/src/parser/schema-parser.ts:46-73`

```ts
  parse(schema: ISchema): IRProject {
    const project: IRProject = {
      pages: [],
      dependencies: {},
    };

    if (schema && schema.length > 0) {
      const rootSchemaNode =
        schema.find((node) => node.name === "Page") || schema[0];
      if (rootSchemaNode) {
        const page = this.parsePage(rootSchemaNode, "index");
        project.pages.push(page);
      }
    }
```

- `packages/code-generator/src/registry/codegen-registry.ts:71-81`

```ts
  loadPack(pack: IMaterialCodeGenPack): void {
    this.registerDescriptors(pack.descriptors);
    if (pack.customLogic) {
      for (const [name, logic] of Object.entries(pack.customLogic)) {
        this.registerCustomLogic(name, logic);
      }
    }
  }
```

- `packages/code-generator/src/solutions/react-vite.ts:37-58`

```ts
const reactViteSolution: ISolution = {
  name: "react-vite",
  description: "鍩轰簬 React 18 + Vite 5 + TypeScript 鐨勬爣鍑?SPA 椤圭洰",
  template: reactViteTemplate,
  preprocessors: [stateLifterPreprocessor],
  componentPlugins: [cssPlugin, jsxPlugin],
  projectPlugins: [
    { ...globalStylePlugin, phase: "post" as const, weight: 10 },
```

- `packages/code-generator/src/solutions/vue-vite.ts:61-103`

```ts
const vueSolution: ISolution = {
  name: "vue-vite",
  description: "鍩轰簬 Vue 3 + Vite 5 + TypeScript 鐨?SPA 椤圭洰",
  template: vueViteTemplate,
  preprocessors: [stateLifterPreprocessor],
  componentPlugins: [vueCssPlugin, vueTemplatePlugin],
```

- `packages/editor/src/editor/utils/codegenWorkerClient.ts:124-150`

```ts
  generateCode(
    payload: GenerateCodeWithWorkerPayload,
  ): Promise<GenerateCodeWithWorkerResult> {
    const requestId = ++this.requestId;

    if (this.pendingRequests.size > 0) {
      this.restartWorker(new CodegenCancelledError());
    }

    const worker = this.ensureWorker();
```

- `packages/editor/src/editor/workers/codegen.worker.ts:61-80`

```ts
  const startedAt = performance.now();
  const treeBuildStartedAt = performance.now();
  const schema = buildComponentTree(
    data.payload.components,
    data.payload.rootId,
  ) as ISchema;
  const treeBuildMs = Math.round(performance.now() - treeBuildStartedAt);

  try {
    const result = await exportSourceCode(schema, {
      solution: data.payload.solution,
      materialPack: antdCodeGenPack,
      skipPublisher: true,
    });
```

## Interactive Elements

- Hero visual: 一条完整的出码流水线动画，节点是 `Schema -> IR -> Solution -> Registry -> Plugins -> Builder -> Publisher`。
- Extra visual: side-by-side cards 对比 `react-vite` 和 `vue-vite` 两个 Solution。
- Code-to-English block target: `packages/code-generator/src/index.ts:158-220`。
- Quiz type: scenario quiz，题目是“如果明天要接入第三种技术栈，为什么比直接写死 React JSX 更容易扩展？”
- Callout: “IR 是标准中间件接口，不是最终产物本身。”

## References To Load While Writing

- `interactive-elements.md`
  Focus: Message Flow / Data Flow Animation, Scenario Quiz, Pattern Cards.
- `content-philosophy.md`
  Focus: Code -> English Translations, Make It Memorable.

## Transition

- Previous module: 解释了编辑器和 iframe 怎么保持稳定通信。
- Next module: 把前面的技术细节收束成面试里能直接说出口的项目介绍与追问回答。
