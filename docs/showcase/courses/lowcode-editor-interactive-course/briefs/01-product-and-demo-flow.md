## Teaching Arc

- Opening hook: “你在画布上拖一个按钮，改几下属性，最后还能导出成真实 React 项目，这已经不是普通组件库了，而是一条完整的搭建流水线。”
- Metaphor: 像搭一个可拆装的样板间。左边是家具仓库，中间是房间，右边是装修面板，最后还能把整套方案变成施工图。
- Why this matters in an interview: 这一模块先帮读者把项目定位说准，避免一开口就把它讲成“封装了一堆组件的前端项目”。

## Code Evidence

- `packages/editor/src/editor/index.tsx:15-54`

```tsx
  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* 椤堕儴瀵艰埅鏍?*/}
      <div className="h-16 flex items-center bg-surface-elevated border-b border-border shadow-sm px-6">
        <Header />
      </div>

      {mode === "edit" ? (
        <div className="flex-1 flex overflow-hidden">
          <Allotment>
            {/* 宸︿晶鐗╂枡闈㈡澘 */}
            <Allotment.Pane preferredSize={280} minSize={240}>
              <div className="h-full custom-panel">
                <div className="p-4">
                  <MaterialWrapper />
                </div>
              </div>
            </Allotment.Pane>
```

- `packages/editor/src/editor/index.tsx:34-54`

```tsx
            {/* 涓棿缂栬緫鍖哄煙 (iframe 闅旂鐢诲竷) */}
            <Allotment.Pane>
              <div className="h-full bg-linear-to-br from-surface to-neutral-100">
                <SimulatorView />
              </div>
            </Allotment.Pane>

            {/* 鍙充晶璁剧疆闈㈡澘 */}
            <Allotment.Pane preferredSize={360} maxSize={480} minSize={320}>
              <div className="h-full custom-panel border-l border-border">
                <div className="p-4">
                  <Setting />
                </div>
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Preview />
        </div>
      )}
```

- `packages/editor/src/editor/components/Header/Header.tsx:154-172`

```tsx
  const generateCode = async (solutionName: string) => {
    const currentRequestId = ++latestGenerateRequestRef.current;
    const requestStartedAt = performance.now();
    setIsExporting(true);
    const { components, rootId } = useComponentsStore.getState();
    if (!components[rootId]) {
      console.error("Schema 涓虹┖锛屾棤娉曞鍑?);
      if (currentRequestId === latestGenerateRequestRef.current) {
        setIsExporting(false);
      }
      return;
    }

    try {
      const result = await getWorkerClient().generateCode({
        components,
        rootId,
        solution: solutionName,
      });
```

- `package.json:6-11`

```json
  "scripts": {
    "postinstall": "pnpm --filter @lowcode/materials gen:meta",
    "dev": "pnpm --filter @lowcode/editor dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint . --report-unused-disable-directives --max-warnings 0"
  },
```

## Interactive Elements

- Hero visual: 一个“三栏工作台 + 导出按钮”的总览信息图，突出“拖拽搭建”和“导出源码”是同一产品链路。
- Quiz type: multiple-choice quiz。
- Code-to-English block target: `packages/editor/src/editor/index.tsx:15-54`。
- Extra visual: numbered step cards，展示“拖拽 -> 配置 -> 预览 -> 导出”。

## References To Load While Writing

- `content-philosophy.md`
  Focus: One Concept Per Screen, Learn by Tracing, Code -> English Translations.
- `interactive-elements.md`
  Focus: Multiple-Choice Quizzes, Numbered Step Cards, Callout Boxes.
- `design-system.md`
  Focus: Module Structure, Typography, Spacing & Layout.

## Transition

- Previous module: none, this is the entry point.
- Next module: 从用户看到的三栏工作台，过渡到“这背后其实是五个包在协作”。
