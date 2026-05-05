## Teaching Arc

- Opening hook: “用户拖一个按钮进去，这个动作不是‘直接往 DOM 里塞一个节点’，而是先改数据，再让渲染器重画。”
- Metaphor: 像物流分拣。物料区先贴上包裹标签，画布再确认投递地址是否合法，仓库系统写入库存，最后展示系统把它摆出来。
- Why this matters in an interview: 这是最适合讲“Schema 驱动”和“配置驱动”两个关键词的模块，也最容易体现你理解过真正的数据流。

## Code Evidence

- `packages/editor/src/editor/components/MaterialWrapper/Material/MaterialItem/index.tsx:26-38`

```tsx
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", `lowcode-component:${name}`);
    e.dataTransfer.effectAllowed = "copy";

    const config = componentConfig[name];
    if (config) {
      simulatorHost.sendDragStartMetadata({
        componentName: name,
        defaultProps: config.defaultProps ?? {},
        desc: config.desc,
      });
    }
  };
```

- `packages/editor/src/renderer/hooks/useDelegatedDnD.ts:298-331`

```ts
    function handleDrop(e: DragEvent) {
      e.preventDefault();
      clearHighlightNow();
      isDraggingRef.current = false;
      container.classList.remove("is-dragging");

      const containerEl = findContainerEl(e.target, container);
      if (!containerEl) return;

      const containerId = +containerEl.dataset.componentId!;
      const containerName = containerEl.dataset.componentType || "";
```

- `packages/editor/src/editor/stores/components.tsx:164-185`

```tsx
  addComponent: (component, parentId) => {
    set((state) => {
      const parent = state.components[parentId];
      if (!parent) return;

      const newComponent: Component = structuredClone(component);
      if (!newComponent.id) {
        newComponent.id = generateUniqueId();
      }

      newComponent.parentId = parentId;
      newComponent.children = [];
```

- `packages/renderer/src/SchemaRenderer.tsx:74-122`

```tsx
const RenderNode: React.FC<RenderNodeProps> = React.memo(({ id }) => {
  const {
    getComponent,
    subscribe,
    componentMap,
    designMode,
    designHooks,
    onEvent,
    onCompRef,
    suspenseFallback,
  } = useRendererContext();

  const getSnapshot = useCallback(() => getComponent(id), [getComponent, id]);
  const component = useSyncExternalStore(subscribe, getSnapshot);
```

## Interactive Elements

- Hero visual: 一条 data flow animation，步骤是 `物料卡片 -> iframe 画布 -> store action -> components Map -> SchemaRenderer`。
- Code-to-English block target: `packages/editor/src/editor/components/MaterialWrapper/Material/MaterialItem/index.tsx:26-38`。
- Extra visual: parentTypes / 容器校验卡片组。
- Quiz type: multiple-choice quiz，题目是“为什么低代码编辑器通常先改 Schema，再改 UI？”

## References To Load While Writing

- `interactive-elements.md`
  Focus: Message Flow / Data Flow Animation, Multiple-Choice Quizzes, Callout Boxes.
- `content-philosophy.md`
  Focus: Learn by Tracing, Code -> English Translations.

## Transition

- Previous module: 已经知道五个包各自负责什么。
- Next module: 从“拖拽能放进去”升级到“为什么 iframe 画布能稳定跟主编辑器保持同步，而且拖得快也不炸”。
