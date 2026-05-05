## Teaching Arc

- Opening hook: “真正难的不是把画布塞进 iframe，而是怎么让主编辑器和 iframe 在高频拖拽、版本断层、大树同步时还保持一致。”
- Metaphor: 像主控室和远端舞台的联动。主控室掌握真相，舞台只是副本；通信慢一点没关系，但绝不能播错镜头。
- Why this matters in an interview: 这是你简历里第二个高价值亮点，最能体现你不是只会搭 UI，而是真的解决过复杂同步和性能问题。

## Code Evidence

- `packages/editor/src/editor/simulator/SimulatorHost.ts:185-198`

```ts
  private onReady() {
    // 娉ㄦ剰锛氫笉绔嬪嵆璁剧疆 iframeReady = true
    // 鍒嗙墖浼犺緭鏈熼棿淇濇寔 false锛岄槻姝㈡柊 patch 绔嬪嵆鍙戦€佸共鎵版湭瀹屾垚鐨勫揩鐓?

    // 娓呴櫎鎵€鏈夋帓闃熺殑澧為噺琛ヤ竵鈥斺€斿叏閲忓揩鐓т細瑕嗙洊涓€鍒?
    this.messageQueue = this.messageQueue.filter(
      (msg) => msg.type !== MessageType.SYNC_COMPONENTS_PATCH,
    );

    this.pendingPatches = [];
    this.flushScheduled = false;
```

- `packages/editor/src/editor/simulator/SimulatorHost.ts:240-293`

```ts
  syncFullState(onComplete?: () => void) {
    const chunkStreamId = ++this._activeChunkStreamId;
    const { components, rootId, version } = useComponentsStore.getState();
    const { curComponentId, mode } = useUIStore.getState();

    const componentKeys = Object.keys(components);

    if (componentKeys.length <= SimulatorHost.CHUNK_SIZE) {
      this.postToIframe(
        createMessage<SyncComponentsStatePayload>(
          MessageType.SYNC_COMPONENTS_STATE,
          { components, rootId, version },
        ),
      );
```

- `packages/editor/src/editor/simulator/SimulatorHost.ts:481-518`

```ts
  private flushPatches() {
    if (this.pendingPatches.length === 0) {
      this.flushScheduled = false;
      return;
    }

    const rawPatches = this.pendingPatches.flatMap((e) => e.patches);

    const merged: SyncComponentsPatchPayload = {
      patches: this.compactPatches(rawPatches),
      baseVersion: this.pendingPatches[0].baseVersion,
      currentVersion:
        this.pendingPatches[this.pendingPatches.length - 1].currentVersion,
    };
```

- `packages/editor/src/editor/simulator/SimulatorRenderer.ts:200-218`

```ts
  private onSyncComponentsPatch(payload: SyncComponentsPatchPayload) {
    if (!this.storeAPI) return;

    const localVersion = this.storeAPI.getVersion();

    if (payload.baseVersion !== localVersion) {
      console.warn(
        `[SimulatorRenderer] Version mismatch: local=${localVersion}, base=${payload.baseVersion}. Requesting full snapshot.`,
      );
      this.requestFullSnapshot("version-mismatch");
      return;
    }
```

## Interactive Elements

- Hero visual: 一条主控室到舞台的 flow animation，角色是 `Host`、`iframe Renderer`、`message queue`、`patch bus`、`WAL buffer`。
- Extra visual: layer toggle demo，对比“全量快照”和“增量 patch”。
- Code-to-English block target: `packages/editor/src/editor/simulator/SimulatorHost.ts:185-198`。
- Quiz type: scenario quiz，题目是“为什么 Ready 握手和离线队列不是锦上添花，而是必需品？”
- Callout: “Host 是 Master，iframe 是 Slave Replica”。

## References To Load While Writing

- `interactive-elements.md`
  Focus: Message Flow / Data Flow Animation, Scenario Quiz, Layer Toggle Demo, Callout Boxes.
- `content-philosophy.md`
  Focus: Metaphors First, Then Reality; Show, Don't Tell.

## Transition

- Previous module: 解释了拖拽如何修改数据和触发渲染。
- Next module: 从“画布怎么稳定同步”转向“这些 Schema 最后怎么被变成 React/Vue 项目代码”。
