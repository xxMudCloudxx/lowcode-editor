import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Patch } from "immer";
import {
  MessageType,
  createMessage,
  type DragStartMetadataPayload,
} from "./protocol";
import {
  SimulatorRenderer,
  type RendererStoreAPI,
} from "./SimulatorRenderer";

describe("SimulatorRenderer chunk recovery", () => {
  let renderer: SimulatorRenderer;
  let storeAPI: RendererStoreAPI;
  let parentPostMessage: ReturnType<typeof vi.fn>;
  let parentDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();

    parentPostMessage = vi.fn();
    parentDescriptor = Object.getOwnPropertyDescriptor(window, "parent");
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    storeAPI = {
      setComponentsState: vi.fn(),
      applyComponentPatches: vi.fn(),
      getVersion: vi.fn(() => 7),
      setUIState: vi.fn(),
      setDraggingMaterial: vi.fn((_data: DragStartMetadataPayload | null) => {}),
    };

    renderer = new SimulatorRenderer();
    renderer.init(storeAPI);

    parentPostMessage.mockClear();
  });

  afterEach(() => {
    renderer.destroy();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();

    if (parentDescriptor) {
      Object.defineProperty(window, "parent", parentDescriptor);
    }
  });

  it("只在唯一分片索引完整时提交全量快照", () => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: createMessage(MessageType.SYNC_COMPONENTS_STATE_CHUNK, {
          transferId: "xfer_1",
          chunkIndex: 0,
          totalChunks: 2,
          components: {
            1: { id: 1, name: "Page", desc: "page", props: {} },
          },
          rootId: 1,
          version: 11,
        }),
      }),
    );

    window.dispatchEvent(
      new MessageEvent("message", {
        data: createMessage(MessageType.SYNC_COMPONENTS_STATE_CHUNK, {
          transferId: "xfer_1",
          chunkIndex: 0,
          totalChunks: 2,
          components: {
            1: { id: 1, name: "Page", desc: "page-duplicate", props: {} },
          },
          rootId: 1,
          version: 11,
        }),
      }),
    );

    expect(storeAPI.setComponentsState).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: createMessage(MessageType.SYNC_COMPONENTS_STATE_CHUNK, {
          transferId: "xfer_1",
          chunkIndex: 1,
          totalChunks: 2,
          components: {
            2: { id: 2, name: "Button", desc: "button", props: {} },
          },
          rootId: 1,
          version: 11,
        }),
      }),
    );

    expect(storeAPI.setComponentsState).toHaveBeenCalledTimes(1);
    expect(storeAPI.setComponentsState).toHaveBeenCalledWith(
      {
        1: { id: 1, name: "Page", desc: "page", props: {} },
        2: { id: 2, name: "Button", desc: "button", props: {} },
      },
      1,
      11,
    );
  });

  it("非法分片索引会直接请求全量重建", () => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: createMessage(MessageType.SYNC_COMPONENTS_STATE_CHUNK, {
          transferId: "xfer_invalid",
          chunkIndex: 2,
          totalChunks: 2,
          components: {},
          rootId: 1,
          version: 9,
        }),
      }),
    );

    expect(parentPostMessage).toHaveBeenCalledTimes(1);
    expect(parentPostMessage.mock.calls[0][0]).toMatchObject({
      type: MessageType.REQUEST_FULL_SNAPSHOT,
      payload: {
        localVersion: 7,
        reason: "chunk-invalid",
      },
    });
    expect(storeAPI.setComponentsState).not.toHaveBeenCalled();
  });

  it("分片超时未收齐时会请求全量重建", () => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: createMessage(MessageType.SYNC_COMPONENTS_STATE_CHUNK, {
          transferId: "xfer_timeout",
          chunkIndex: 0,
          totalChunks: 2,
          components: {
            1: { id: 1, name: "Page", desc: "page", props: {} },
          },
          rootId: 1,
          version: 12,
        }),
      }),
    );

    vi.advanceTimersByTime(3000);

    expect(parentPostMessage).toHaveBeenCalledTimes(1);
    expect(parentPostMessage.mock.calls[0][0]).toMatchObject({
      type: MessageType.REQUEST_FULL_SNAPSHOT,
      payload: {
        localVersion: 7,
        reason: "chunk-timeout",
      },
    });
    expect(storeAPI.setComponentsState).not.toHaveBeenCalled();
  });

  it("版本断层仍会按原逻辑请求恢复", () => {
    const patches: Patch[] = [
      { op: "replace", path: ["components", "2", "props", "text"], value: "B" },
    ];

    window.dispatchEvent(
      new MessageEvent("message", {
        data: createMessage(MessageType.SYNC_COMPONENTS_PATCH, {
          patches,
          baseVersion: 6,
          currentVersion: 7,
        }),
      }),
    );

    expect(parentPostMessage).toHaveBeenCalledTimes(1);
    expect(parentPostMessage.mock.calls[0][0]).toMatchObject({
      type: MessageType.REQUEST_FULL_SNAPSHOT,
      payload: {
        localVersion: 7,
        reason: "version-mismatch",
      },
    });
    expect(storeAPI.applyComponentPatches).not.toHaveBeenCalled();
  });
});
