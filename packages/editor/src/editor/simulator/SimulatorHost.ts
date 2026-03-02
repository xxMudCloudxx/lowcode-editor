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

import {
  MessageType,
  createMessage,
  isLowcodeMessage,
  type MessageEnvelope,
  type SyncComponentsStatePayload,
  type SyncComponentsPatchPayload,
  type SyncUIStatePayload,
  type DragStartMetadataPayload,
  type DispatchActionPayload,
  type SelectComponentPayload,
  type HoverComponentPayload,
  type ForwardKeyboardEventPayload,
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
        this.onRequestFullSnapshot();
        break;
    }
  };

  // ==================== 事件处理 ====================

  /**
   * iframe 报告自己已就绪
   */
  private onReady() {
    this.iframeReady = true;

    // 清除所有排队的增量补丁——全量快照会覆盖一切
    this.messageQueue = this.messageQueue.filter(
      (msg) => msg.type !== MessageType.SYNC_COMPONENTS_PATCH,
    );

    // 清空待发送的批处理补丁
    this.pendingPatches = [];
    this.flushScheduled = false;

    // 1. 首次同步完整状态
    this.syncFullState();

    // 2. 清空剩余排队消息（UI State、拖拽等）
    this.flushQueue();
  }

  /**
   * iframe 请求全量快照（版本断层自愈）
   */
  private onRequestFullSnapshot() {
    this.syncFullState();
  }

  /**
   * 同步完整的 Store 状态到 iframe（附带当前 version）
   */
  syncFullState() {
    const { components, rootId, version } = useComponentsStore.getState();
    const { curComponentId, mode } = useUIStore.getState();

    this.send<SyncComponentsStatePayload>(MessageType.SYNC_COMPONENTS_STATE, {
      components,
      rootId,
      version,
    });
    this.send<SyncUIStatePayload>(MessageType.SYNC_UI_STATE, {
      curComponentId,
      mode,
    });
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
   * 使用微任务（queueMicrotask）级别的批处理，
   * 将同一个事件循环 tick 内的多个补丁合并为一条消息发送，
   * 避免高频操作（如快速拖拽、连续修改 props）时的消息风暴。
   */
  private onPatchGenerated = (event: PatchEvent) => {
    this.pendingPatches.push(event);

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flushPatches());
    }
  };

  /**
   * 将所有 pending 补丁合并为一条 SYNC_COMPONENTS_PATCH 消息发出
   */
  private flushPatches() {
    if (this.pendingPatches.length === 0) {
      this.flushScheduled = false;
      return;
    }

    const merged: SyncComponentsPatchPayload = {
      patches: this.pendingPatches.flatMap((e) => e.patches),
      baseVersion: this.pendingPatches[0].baseVersion,
      currentVersion:
        this.pendingPatches[this.pendingPatches.length - 1].currentVersion,
    };

    this.send<SyncComponentsPatchPayload>(
      MessageType.SYNC_COMPONENTS_PATCH,
      merged,
    );

    this.pendingPatches = [];
    this.flushScheduled = false;
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

  // ==================== 对外拖拽桥接 API ====================

  /**
   * 通知 iframe 有物料开始被拖拽
   */
  sendDragStartMetadata(data: DragStartMetadataPayload) {
    this.send<DragStartMetadataPayload>(MessageType.DRAG_START_METADATA, data);
  }

  /**
   * 通知 iframe 拖拽结束
   */
  sendDragEnd() {
    this.send(MessageType.DRAG_END, {});
  }
}

/**
 * 全局单例
 */
export const simulatorHost = new SimulatorHost();
