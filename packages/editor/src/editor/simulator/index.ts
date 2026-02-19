/**
 * @file simulator/index.ts
 * @description Barrel exports for the simulator module.
 */

export { SimulatorHost, simulatorHost } from "./SimulatorHost";
export { SimulatorRenderer, simulatorRenderer } from "./SimulatorRenderer";
export {
  MessageType,
  createMessage,
  isLowcodeMessage,
  type MessageEnvelope,
  type SyncComponentsStatePayload,
  type SyncUIStatePayload,
  type DragStartMetadataPayload,
  type DispatchActionPayload,
  type SelectComponentPayload,
  type HoverComponentPayload,
  type ForwardKeyboardEventPayload,
} from "./protocol";
