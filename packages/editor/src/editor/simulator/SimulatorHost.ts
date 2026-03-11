/**
 * @file simulator/SimulatorHost.ts
 * @description
 * Host 侧的 Simulator 通信管理器。
 * 负责：
 * - 管理 iframe 的生命周期
 * - Ready 握手机制
 * - 消息队列（确保 iframe Ready 前的消息不丢失）
 * - 通过 PatchEventBus 接收增量补丁 → postMessage 同步到 Iframe
 * - 接收 iframe 发来的 DISPATCH_ACTION 并执行
 * - 处理 iframe 的 REQUEST_FULL_SNAPSHOT 自愈降级请求
 *
 * @version 2.0
 * 变更：
 * - 组件状态同步从全量 subscribe 改为增量补丁流（patchEventBus）
 * - 新增微任务级别的补丁批处理，避免高频操作时的消息风暴
 * - UI Store 保持全量同步不变（数据量极小，无需增量化）
 *
 * @module Simulator/Host
 */

import type { Patch } from "immer";
import {
  MessageType,
  createMessage,
  isLowcodeMessage,
  type MessageEnvelope,
  type SyncComponentsStatePayload,
  type SyncComponentsStateChunkPayload,
  type SyncComponentsPatchPayload,
  type SyncUIStatePayload,
  type DragStartMetadataPayload,
  type DispatchActionPayload,
  type SelectComponentPayload,
  type HoverComponentPayload,
  type ForwardKeyboardEventPayload,
  type RequestFullSnapshotPayload,
} from "./protocol";

import { useComponentsStore } from "../stores/components";
import { useUIStore } from "../stores/uiStore";
import { patchEventBus, type PatchEvent } from "../utils/patchEventBus";

export class SimulatorHost {
  private iframe: HTMLIFrameElement | null = null;
  private iframeReady = false;
  private messageQueue: MessageEnvelope[] = [];
  private unsubscribers: (() => void)[] = [];

  // ---------- 补丁批处理 ----------
  private pendingPatches: PatchEvent[] = [];
  private flushScheduled = false;

  // ---------- L5: WAL 环形缓冲 ----------
  private static readonly WAL_CAPACITY = 50;
  private walBuffer: SyncComponentsPatchPayload[] = [];

  // ---------- 分片传输 ----------
  private static readonly CHUNK_SIZE = 100;
  private static _transferCounter = 0;

  // ---------- L5: WAL 运行时统计 ----------
  private walStats = {
    hits: 0,
    misses: 0,
    fullSnapshots: 0,
    depths: [] as number[],
  };

  // ---------- L5: 模拟断层（开发调试） ----------
  private _dropNextN = 0;

  // ---------- L6: 刷新策略 ----------
  private flushStrategy: "microtask" | "raf" = "microtask";

  // ==================== 生命周期 ====================

  /**
   * 绑定到一个 iframe 元素，开始监听消息
   */
  connect(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.iframeReady = false;
    this.messageQueue = [];

    // 监听来自 iframe 的消息
    window.addEventListener("message", this.handleMessage);

    // 订阅 PatchEventBus（增量补丁流）+ UI Store（全量同步）
    this.subscribeStores();
  }

  /**
   * 断开连接，清理所有监听
   */
  disconnect() {
    window.removeEventListener("message", this.handleMessage);
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.iframe = null;
    this.iframeReady = false;
    this.messageQueue = [];
    this.pendingPatches = [];
    this.flushScheduled = false;
    this.walBuffer = [];
  }

  /**
   * 获取 iframe 内的 document 对象
   */
  getIframeDocument(): Document | null {
    return this.iframe?.contentDocument || null;
  }

  // ==================== 消息发送 ====================

  /**
   * 向 iframe 发送消息。如果 iframe 未 Ready，消息会进入队列。
   */
  private send<T>(type: MessageType, payload: T) {
    const message = createMessage(type, payload);

    if (!this.iframeReady) {
      this.messageQueue.push(message);
      return;
    }

    this.postToIframe(message);
  }

  private postToIframe(message: MessageEnvelope) {
    if (!this.iframe?.contentWindow) return;
    this.iframe.contentWindow.postMessage(message, "*");
  }

  /**
   * 当 iframe Ready 后，清空消息队列
   */
  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.postToIframe(msg);
    }
  }

  // ==================== 消息接收 ====================

  private handleMessage = (event: MessageEvent) => {
    if (!isLowcodeMessage(event.data)) return;

    // 安全检查：确保消息来自我们的 iframe
    if (this.iframe && event.source !== this.iframe.contentWindow) return;

    const { type, payload } = event.data;

    switch (type) {
      case MessageType.READY:
        this.onReady();
        break;
      case MessageType.DISPATCH_ACTION:
        this.onDispatchAction(payload as DispatchActionPayload);
        break;
      case MessageType.SELECT_COMPONENT:
        this.onSelectComponent(payload as SelectComponentPayload);
        break;
      case MessageType.HOVER_COMPONENT:
        this.onHoverComponent(payload as HoverComponentPayload);
        break;
      case MessageType.FORWARD_KEYBOARD_EVENT:
        this.onForwardKeyboardEvent(payload as ForwardKeyboardEventPayload);
        break;
      case MessageType.REQUEST_FULL_SNAPSHOT:
        this.onRequestFullSnapshot(payload as RequestFullSnapshotPayload);
        break;
    }
  };

  // ==================== 事件处理 ====================

  /**
   * iframe 报告自己已就绪
   */
  private onReady() {
    // 注意：不立即设置 iframeReady = true
    // 分片传输期间保持 false，防止新 patch 立即发送干扰未完成的快照

    // 清除所有排队的增量补丁——全量快照会覆盖一切
    this.messageQueue = this.messageQueue.filter(
      (msg) => msg.type !== MessageType.SYNC_COMPONENTS_PATCH,
    );

    // 清空待发送的批处理补丁
    this.pendingPatches = [];
    this.flushScheduled = false;

    // 同步完整状态，完成后才启用 iframeReady
    this.syncFullState(() => {
      this.iframeReady = true;
      this.flushQueue();
    });
  }

  /**
   * iframe 请求全量快照（版本断层自愈）
   *
   * L5 WAL 回放：如果 Renderer 携带了 localVersion，
   * 优先检查 WAL 缓冲区是否能覆盖版本差距。
   * 能覆盖 → 补发缺失的 patches（轻量）；
   * 不能覆盖 → 降级为全量快照。
   */
  private onRequestFullSnapshot(payload?: RequestFullSnapshotPayload) {
    if (payload?.localVersion != null) {
      const replayed = this.tryReplayFromWAL(payload.localVersion);
      if (replayed) {
        this.send<SyncComponentsPatchPayload>(
          MessageType.SYNC_COMPONENTS_PATCH,
          replayed,
        );
        return;
      }
    }
    // 降级：全量快照
    this.walStats.fullSnapshots++;
    this.syncFullState();
  }

  /**
   * 同步完整的 Store 状态到 iframe。
   * 组件数 ≤ CHUNK_SIZE 时单消息发送；
   * 组件数 > CHUNK_SIZE 时拆分为多个 chunk，通过 setTimeout(0) 逐帧发送，
   * 避免 structured clone 序列化阻塞主线程。
   *
   * @param onComplete 全部 chunk 发送完成后的回调
   */
  syncFullState(onComplete?: () => void) {
    const { components, rootId, version } = useComponentsStore.getState();
    const { curComponentId, mode } = useUIStore.getState();

    const componentKeys = Object.keys(components);

    if (componentKeys.length <= SimulatorHost.CHUNK_SIZE) {
      // 小负载：单消息发送（原始行为）
      this.postToIframe(
        createMessage<SyncComponentsStatePayload>(
          MessageType.SYNC_COMPONENTS_STATE,
          { components, rootId, version },
        ),
      );
      this.postToIframe(
        createMessage<SyncUIStatePayload>(MessageType.SYNC_UI_STATE, {
          curComponentId,
          mode,
        }),
      );
      onComplete?.();
      return;
    }

    // 大负载：分片传输
    const totalChunks = Math.ceil(
      componentKeys.length / SimulatorHost.CHUNK_SIZE,
    );
    const transferId = `xfer_${++SimulatorHost._transferCounter}`;

    const sendChunk = (index: number) => {
      if (index >= totalChunks) {
        // 所有 chunk 发送完毕，发送 UI 状态
        this.postToIframe(
          createMessage<SyncUIStatePayload>(MessageType.SYNC_UI_STATE, {
            curComponentId,
            mode,
          }),
        );
        onComplete?.();
        return;
      }

      const start = index * SimulatorHost.CHUNK_SIZE;
      const chunkKeys = componentKeys.slice(
        start,
        start + SimulatorHost.CHUNK_SIZE,
      );
      const chunkComponents: Record<number, any> = {};
      for (const key of chunkKeys) {
        chunkComponents[Number(key)] = components[Number(key)];
      }

      this.postToIframe(
        createMessage<SyncComponentsStateChunkPayload>(
          MessageType.SYNC_COMPONENTS_STATE_CHUNK,
          {
            transferId,
            chunkIndex: index,
            totalChunks,
            components: chunkComponents,
            rootId,
            version,
          },
        ),
      );

      // 让出主线程，下一帧发送下一个 chunk
      setTimeout(() => sendChunk(index + 1), 0);
    };

    sendChunk(0);
  }

  /**
   * L5: 尝试从 WAL 环形缓冲区中找到从 fromVersion 到最新的连续 patch 链。
   * @returns 合并后的 SyncComponentsPatchPayload，或 null（无法覆盖）
   */
  private tryReplayFromWAL(
    fromVersion: number,
  ): SyncComponentsPatchPayload | null {
    const startIdx = this.walBuffer.findIndex(
      (e) => e.baseVersion === fromVersion,
    );
    if (startIdx === -1) {
      this.walStats.misses++;
      return null;
    }

    const entries = this.walBuffer.slice(startIdx);

    // 校验连续性：每条记录的 baseVersion 必须等于前一条的 currentVersion
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].baseVersion !== entries[i - 1].currentVersion) {
        this.walStats.misses++;
        return null; // 链断裂，无法回放
      }
    }

    // 记录命中统计
    this.walStats.hits++;
    this.walStats.depths.push(entries.length);
    console.log(
      `[WAL] ✅ 命中！回放 ${entries.length} 条补丁 (version ${fromVersion} → ${entries[entries.length - 1].currentVersion})`,
    );

    return {
      patches: entries.flatMap((e) => e.patches),
      baseVersion: fromVersion,
      currentVersion: entries[entries.length - 1].currentVersion,
    };
  }

  /**
   * iframe 请求执行一个 Store Action
   */
  private onDispatchAction(payload: DispatchActionPayload) {
    const { actionName, args } = payload;

    // 特殊 Action：从 iframe 触发的复制操作
    if (actionName === "__copyToClipboard") {
      const componentId = args[0] as number;
      const { components } = useComponentsStore.getState();
      const tree = this.buildClipboardTree(componentId, components);
      if (tree) {
        useUIStore.getState().setClipboard(tree);
      }
      return;
    }

    // 通用 Action：直接调用 Store 方法
    const store = useComponentsStore.getState();
    const action = (store as any)[actionName];
    if (typeof action === "function") {
      action(...args);
    } else {
      console.warn(`[SimulatorHost] Unknown action: ${actionName}`);
    }
  }

  /**
   * 从范式化 Map 构建剪切板树
   */
  private buildClipboardTree(
    id: number,
    components: Record<number, any>,
  ): any | null {
    const node = components[id];
    if (!node) return null;

    const children =
      node.children && node.children.length > 0
        ? node.children
            .map((childId: number) =>
              this.buildClipboardTree(childId, components),
            )
            .filter(Boolean)
        : undefined;

    return {
      id: node.id,
      name: node.name,
      props: node.props,
      desc: node.desc,
      parentId: node.parentId,
      children,
      styles: node.styles,
    };
  }

  /**
   * iframe 内部选中了组件
   */
  private onSelectComponent(payload: SelectComponentPayload) {
    useUIStore.getState().setCurComponentId(payload.componentId);
  }

  /**
   * iframe 内部 hover 了组件（当前不需要同步回 Host，预留接口）
   */
  private onHoverComponent(_payload: HoverComponentPayload) {
    // 目前 hover 状态不需要在 Host 侧追踪
  }

  /**
   * iframe 转发的键盘事件：在 Host window 上派发合成的 KeyboardEvent，
   * 从而触发 useShortcutKeys 中的快捷键处理。
   */
  private onForwardKeyboardEvent(payload: ForwardKeyboardEventPayload) {
    const syntheticEvent = new KeyboardEvent(payload.type, {
      key: payload.key,
      code: payload.code,
      ctrlKey: payload.ctrlKey,
      metaKey: payload.metaKey,
      shiftKey: payload.shiftKey,
      altKey: payload.altKey,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(syntheticEvent);
  }

  // ==================== 补丁批处理 ====================

  /**
   * 收到 patchEventBus 补丁时的回调。
   * 将补丁压入队列，按当前刷新策略调度 flush。
   */
  private onPatchGenerated = (event: PatchEvent) => {
    this.pendingPatches.push(event);
    this.scheduleFlush();
  };

  /**
   * L6: 按策略调度 flush
   * - "microtask": 微任务级（同一 tick 内合批，最低延迟）
   * - "raf": 帧级（每个动画帧最多发一条，适合高频拖拽）
   */
  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;

    if (this.flushStrategy === "raf") {
      requestAnimationFrame(() => this.flushPatches());
    } else {
      queueMicrotask(() => this.flushPatches());
    }
  }

  /**
   * 将所有 pending 补丁合并为一条 SYNC_COMPONENTS_PATCH 消息发出。
   * 包含 L4 补丁压缩 + L5 WAL 存储。
   */
  private flushPatches() {
    if (this.pendingPatches.length === 0) {
      this.flushScheduled = false;
      return;
    }

    const rawPatches = this.pendingPatches.flatMap((e) => e.patches);

    const merged: SyncComponentsPatchPayload = {
      // L4: 补丁压缩——同路径 replace 去重
      patches: this.compactPatches(rawPatches),
      baseVersion: this.pendingPatches[0].baseVersion,
      currentVersion:
        this.pendingPatches[this.pendingPatches.length - 1].currentVersion,
    };

    // L5: 存入 WAL 环形缓冲（无论是否实际发送，WAL 都要记录）
    this.walBuffer.push(merged);
    if (this.walBuffer.length > SimulatorHost.WAL_CAPACITY) {
      this.walBuffer.shift();
    }

    // 开发调试：模拟版本断层——跳过发送但 WAL 已记录
    if (this._dropNextN > 0) {
      this._dropNextN--;
      console.warn(
        `[WAL] 🧪 模拟断层：丢弃 patch (v${merged.baseVersion}→v${merged.currentVersion})，剩余 ${this._dropNextN} 次`,
      );
    } else {
      this.send<SyncComponentsPatchPayload>(
        MessageType.SYNC_COMPONENTS_PATCH,
        merged,
      );
    }

    this.pendingPatches = [];
    this.flushScheduled = false;
  }

  // ==================== L4: 补丁压缩 ====================

  /**
   * 对同路径的 replace 操作去重，只保留最终值。
   * add/remove 操作保持原序不动（它们影响结构完整性）。
   *
   * 例：用户用颜色选择器快速滑动产生 3 个 replace：
   *   [set color=#f00, set color=#0f0, set color=#00f]
   * 压缩后：[set color=#00f]
   */
  private compactPatches(patches: Patch[]): Patch[] {
    if (patches.length <= 1) return patches;

    // 记录每个路径上最后出现的 replace 操作的索引
    const lastReplaceByPath = new Map<string, number>();
    const removableIndices = new Set<number>();

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      if (patch.op === "replace") {
        const pathKey = patch.path.join("/");
        const prevIndex = lastReplaceByPath.get(pathKey);
        if (prevIndex !== undefined) {
          removableIndices.add(prevIndex);
        }
        lastReplaceByPath.set(pathKey, i);
      }
    }

    if (removableIndices.size === 0) return patches;
    return patches.filter((_, i) => !removableIndices.has(i));
  }

  // ==================== Store 订阅 ====================

  /**
   * 订阅数据源，变更时自动同步到 iframe：
   * - Components Store → 通过 patchEventBus 增量补丁流
   * - UI Store → 保持全量同步（数据量极小，无需增量化）
   */
  private subscribeStores() {
    // 订阅 PatchEventBus（替代原来的 useComponentsStore.subscribe 全量同步）
    const unsubPatch = patchEventBus.subscribe(this.onPatchGenerated);

    // 订阅 UI Store (只同步 iframe 关心的字段，保持全量同步)
    const unsubUI = useUIStore.subscribe((state) => {
      this.send<SyncUIStatePayload>(MessageType.SYNC_UI_STATE, {
        curComponentId: state.curComponentId,
        mode: state.mode,
      });
    });

    this.unsubscribers.push(unsubPatch, unsubUI);
  }

  // ==================== 对外配置 API ====================

  /**
   * L6: 切换刷新策略
   */
  setFlushStrategy(strategy: "microtask" | "raf") {
    this.flushStrategy = strategy;
  }

  /**
   * L5: 获取 WAL 运行时统计
   */
  getWALStats() {
    const { hits, misses, fullSnapshots, depths } = this.walStats;
    return {
      hits,
      misses,
      fullSnapshots,
      depths,
      avgDepth:
        depths.length > 0
          ? depths.reduce((a, b) => a + b, 0) / depths.length
          : 0,
      maxDepth: depths.length > 0 ? Math.max(...depths) : 0,
      walBufferSize: this.walBuffer.length,
    };
  }

  /**
   * L5: 重置统计数据
   */
  resetWALStats() {
    this.walStats = { hits: 0, misses: 0, fullSnapshots: 0, depths: [] };
  }

  /**
   * 开发调试：模拟版本断层
   * 调用后，接下来的 N 次 patch 会被故意丢弃（不发给 iframe），
   * 但 WAL 仍然记录。等第 N+1 次 patch 正常发出时，
   * Renderer 检测到版本不匹配 → 触发 REQUEST_FULL_SNAPSHOT → WAL 回放。
   *
   * 用法（浏览器控制台）：
   *   __LOWCODE_WAL__.simulateGap(3)   // 丢弃 3 个 patch
   *   // 然后正常操作 4 次（前 3 次被丢弃，第 4 次触发 WAL 回放）
   *   __LOWCODE_WAL__.stats()           // 查看统计
   */
  simulateVersionGap(n: number) {
    this._dropNextN = n;
    console.log(
      `[WAL] 🧪 将丢弃接下来 ${n} 个 patch 以模拟版本断层。请进行 ${n + 1} 次编辑操作。`,
    );
  }

  // ==================== 对外拖拽桥接 API ====================

  /**
   * 通知 iframe 有物料开始被拖拽
   */
  sendDragStartMetadata(data: DragStartMetadataPayload) {
    // L6: 拖拽开始 → 切换为帧级节流，避免高频消息风暴
    this.setFlushStrategy("raf");
    this.send<DragStartMetadataPayload>(MessageType.DRAG_START_METADATA, data);
  }

  /**
   * 通知 iframe 拖拽结束
   */
  sendDragEnd() {
    this.send(MessageType.DRAG_END, {});
    // L6: 拖拽结束 → 切回微任务级，恢复最低延迟精确模式
    this.setFlushStrategy("microtask");
  }
}

/**
 * 全局单例
 */
export const simulatorHost = new SimulatorHost();

// ==================== 开发调试 API ====================
if (import.meta.env.DEV) {
  (window as any).__LOWCODE_WAL__ = {
    /** 查看 WAL 统计 */
    stats: () => {
      const s = simulatorHost.getWALStats();
      console.table({
        命中次数: s.hits,
        未命中次数: s.misses,
        全量快照降级: s.fullSnapshots,
        平均回放深度: s.avgDepth.toFixed(2),
        最大回放深度: s.maxDepth,
        当前缓冲条数: s.walBufferSize,
      });
      if (s.depths.length > 0) {
        console.log("深度分布:", s.depths);
      }
      return s;
    },
    /** 模拟版本断层 */
    simulateGap: (n: number) => simulatorHost.simulateVersionGap(n),
    /** 重置统计 */
    reset: () => simulatorHost.resetWALStats(),
  };
  console.log(
    "[WAL Debug] 已挂载 __LOWCODE_WAL__。用法:\n" +
      "  __LOWCODE_WAL__.simulateGap(3)  // 模拟丢弃 3 个 patch\n" +
      "  __LOWCODE_WAL__.stats()          // 查看统计\n" +
      "  __LOWCODE_WAL__.reset()          // 重置统计",
  );
}
