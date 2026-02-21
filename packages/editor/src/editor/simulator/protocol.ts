/**
 * @file simulator/protocol.ts
 * @description
 * iframe 与 Host 之间的双向通信协议定义。
 * 所有 postMessage 消息都必须符合 MessageEnvelope 格式。
 *
 * 设计原则：
 * - Host 是 Store 的唯一 Master
 * - Iframe (Renderer) 持有只读副本 (Slave Replica)
 * - 所有写操作都通过 DISPATCH_ACTION 委托给 Host
 */

// ==================== 消息类型枚举 ====================

export enum MessageType {
  // -------- Handshake --------
  /** Iframe 加载完毕，通知 Host 可以开始同步 */
  READY = "READY",

  // -------- Host -> Iframe --------
  /** 同步完整的组件 Store 状态 */
  SYNC_COMPONENTS_STATE = "SYNC_COMPONENTS_STATE",
  /** 同步 UI Store 状态（选中 ID、模式等） */
  SYNC_UI_STATE = "SYNC_UI_STATE",
  /** 同步物料配置（仅在初始化时发送一次） */
  SYNC_COMPONENT_CONFIG = "SYNC_COMPONENT_CONFIG",
  /** 从主窗口开始拖拽物料，传递 schema 元数据 */
  DRAG_START_METADATA = "DRAG_START_METADATA",
  /** 拖拽结束 */
  DRAG_END = "DRAG_END",

  // -------- Iframe -> Host --------
  /** 请求 Host 执行一个 Store Action */
  DISPATCH_ACTION = "DISPATCH_ACTION",
  /** iframe 内部点击选中了组件 */
  SELECT_COMPONENT = "SELECT_COMPONENT",
  /** iframe 内部 hover 了组件 */
  HOVER_COMPONENT = "HOVER_COMPONENT",
  /** 转发键盘事件到 Host */
  FORWARD_KEYBOARD_EVENT = "FORWARD_KEYBOARD_EVENT",
}

// ==================== Payload 类型 ====================

/** 握手消息 */
export interface ReadyPayload {
  version: string;
}

/** 完整 Components Store 状态 */
export interface SyncComponentsStatePayload {
  components: Record<number, import("@lowcode/schema").Component>;
  rootId: number;
}

/** UI Store 状态子集 (只同步 iframe 需要的) */
export interface SyncUIStatePayload {
  curComponentId: number | null;
  mode: "edit" | "preview";
}

/** 物料 Schema 元数据（拖拽旁路通信） */
export interface DragStartMetadataPayload {
  /** 被拖拽的物料类型名 */
  componentName: string;
  /** 默认 props */
  defaultProps: Record<string, any>;
  /** 描述 */
  desc: string;
}

/** 请求 Host 执行 Action */
export interface DispatchActionPayload {
  /** Action 名称，对应 useComponentsStore 的方法名 */
  actionName: string;
  /** Action 参数 */
  args: any[];
}

/** 选中组件 */
export interface SelectComponentPayload {
  componentId: number | null;
}

/** 悬浮组件 */
export interface HoverComponentPayload {
  componentId: number | undefined;
}

/** 转发键盘事件 */
export interface ForwardKeyboardEventPayload {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  type: "keydown" | "keyup";
}

// ==================== 消息信封 ====================

/**
 * 所有 postMessage 消息的统一信封格式。
 * 使用 `__LOWCODE__` 标识符区分来自我们系统的消息。
 */
export interface MessageEnvelope<T = unknown> {
  /** 固定标识符，用于过滤非本系统消息 */
  __LOWCODE__: true;
  /** 消息类型 */
  type: MessageType;
  /** 消息载荷 */
  payload: T;
  /** 消息 ID (用于调试追踪) */
  id: string;
  /** 时间戳 */
  timestamp: number;
}

// ==================== 工具函数 ====================

let _msgCounter = 0;

/**
 * 创建一个符合协议格式的消息信封
 */
export function createMessage<T>(
  type: MessageType,
  payload: T,
): MessageEnvelope<T> {
  return {
    __LOWCODE__: true,
    type,
    payload,
    id: `msg_${++_msgCounter}_${Date.now()}`,
    timestamp: Date.now(),
  };
}

/**
 * 类型守卫：判断一个 MessageEvent 的 data 是否为合法的 Lowcode 消息
 */
export function isLowcodeMessage(data: unknown): data is MessageEnvelope {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).__LOWCODE__ === true &&
    typeof (data as any).type === "string"
  );
}
