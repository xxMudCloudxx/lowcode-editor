/**
 * @file simulator/SimulatorRenderer.ts
 * @description
 * Iframe (Renderer) 侧的通信管理器。
 * 负责：
 * - 发送 READY 握手
 * - 接收 Host 同步的 Store 状态并更新本地 Slave Store
 * - 将 iframe 内的交互事件 (click/hover/drag) 通过 postMessage 发送给 Host
 *
 * @module Simulator/Renderer
 */

import {
  MessageType,
  createMessage,
  isLowcodeMessage,
   
  type SyncComponentsStatePayload,
  type SyncUIStatePayload,
  type DragStartMetadataPayload,
  type DispatchActionPayload,
  type SelectComponentPayload,
  type HoverComponentPayload,
  type ForwardKeyboardEventPayload,
} from "./protocol";

/**
 * Renderer 侧 Store 接口（由外部注入，解耦依赖）
 */
export interface RendererStoreAPI {
  setComponentsState: (components: Record<number, any>, rootId: number) => void;
  setUIState: (curComponentId: number | null, mode: "edit" | "preview") => void;
  setDraggingMaterial: (data: DragStartMetadataPayload | null) => void;
}

export class SimulatorRenderer {
  private storeAPI: RendererStoreAPI | null = null;

  // ==================== 生命周期 ====================

  /**
   * 初始化 Renderer 通信。传入 Store API 用于状态写入。
   */
  init(storeAPI: RendererStoreAPI) {
    this.storeAPI = storeAPI;

    // 监听来自 Host 的消息
    window.addEventListener("message", this.handleMessage);

    // 监听键盘事件并转发给 Host
    window.addEventListener("keydown", this.handleKeyDown);

    // 发送 READY 握手
    this.sendReady();
  }

  /**
   * 销毁，清理监听
   */
  destroy() {
    window.removeEventListener("message", this.handleMessage);
    window.removeEventListener("keydown", this.handleKeyDown);
    this.storeAPI = null;
  }

  // ==================== 握手 ====================

  private sendReady() {
    this.sendToHost(MessageType.READY, { version: "1.0.0" });
  }

  // ==================== 消息发送 ====================

  private sendToHost<T>(type: MessageType, payload: T) {
    if (!window.parent || window.parent === window) {
      console.warn("[SimulatorRenderer] Not running inside an iframe.");
      return;
    }
    const message = createMessage(type, payload);
    window.parent.postMessage(message, "*");
  }

  // ==================== 消息接收 ====================

  private handleMessage = (event: MessageEvent) => {
    if (!isLowcodeMessage(event.data)) return;

    const { type, payload } = event.data;

    switch (type) {
      case MessageType.SYNC_COMPONENTS_STATE:
        this.onSyncComponentsState(payload as SyncComponentsStatePayload);
        break;
      case MessageType.SYNC_UI_STATE:
        this.onSyncUIState(payload as SyncUIStatePayload);
        break;
      case MessageType.DRAG_START_METADATA:
        this.onDragStartMetadata(payload as DragStartMetadataPayload);
        break;
      case MessageType.DRAG_END:
        this.onDragEnd();
        break;
    }
  };

  // ==================== 状态同步处理 ====================

  private onSyncComponentsState(payload: SyncComponentsStatePayload) {
    this.storeAPI?.setComponentsState(payload.components, payload.rootId);
  }

  private onSyncUIState(payload: SyncUIStatePayload) {
    this.storeAPI?.setUIState(payload.curComponentId, payload.mode);
  }

  private onDragStartMetadata(payload: DragStartMetadataPayload) {
    this.storeAPI?.setDraggingMaterial(payload);
  }

  private onDragEnd() {
    this.storeAPI?.setDraggingMaterial(null);
  }

  // ==================== Iframe -> Host：对外 API ====================

  /**
   * 请求 Host 执行一个 Store Action
   */
  dispatchAction(actionName: string, ...args: any[]) {
    this.sendToHost<DispatchActionPayload>(MessageType.DISPATCH_ACTION, {
      actionName,
      args,
    });
  }

  /**
   * 通知 Host：iframe 内选中了组件
   */
  selectComponent(componentId: number | null) {
    this.sendToHost<SelectComponentPayload>(MessageType.SELECT_COMPONENT, {
      componentId,
    });
  }

  /**
   * 通知 Host：iframe 内 hover 了组件
   */
  hoverComponent(componentId: number | undefined) {
    this.sendToHost<HoverComponentPayload>(MessageType.HOVER_COMPONENT, {
      componentId,
    });
  }

  // ==================== 键盘事件转发 ====================

  /**
   * 截获 iframe 内的键盘事件，转发给 Host。
   * 只转发带修饰键的组合或功能键，避免干扰正常输入。
   */
  private handleKeyDown = (e: KeyboardEvent) => {
    // 跳过输入框中的事件
    const activeElement = document.activeElement;
    if (
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA" ||
      (activeElement as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    const isFunctionKey = ["Delete", "Backspace"].includes(e.key);

    // 只转发快捷键组合或功能键
    if (isCmdOrCtrl || isFunctionKey) {
      e.preventDefault();
      this.sendToHost<ForwardKeyboardEventPayload>(
        MessageType.FORWARD_KEYBOARD_EVENT,
        {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          type: "keydown",
        },
      );
    }
  };
}

/**
 * 全局单例
 */
export const simulatorRenderer = new SimulatorRenderer();
