/**
 * @file /src/editor/stores/history.test.ts
 * @description
 * historyStore 单元测试
 * 测试增量补丁历史管理功能：addPatch、undo、redo、clear
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useHistoryStore } from "./historyStore";
import { useComponentsStore } from "./components";
import type { Patch } from "immer";

/**
 * 清理所有 store 状态的辅助函数
 * 注意：先 reset，再 clear，确保 history 干净
 */
const cleanupStores = () => {
  // 先标记为正在应用补丁，这样 resetComponents 不会被记录
  useHistoryStore.getState().setApplyingPatches(true);
  useComponentsStore.getState().resetComponents();
  useHistoryStore.getState().setApplyingPatches(false);
  useHistoryStore.getState().clear();
};

// 在每个测试用例开始前，重置 store 状态
beforeEach(() => {
  act(() => {
    cleanupStores();
  });
});

describe("useHistoryStore 核心功能", () => {
  describe("addPatch", () => {
    it("应该能记录补丁到 past 栈", () => {
      const patches: Patch[] = [
        {
          op: "add",
          path: ["components", "123"],
          value: { id: 123, name: "Button" },
        },
      ];
      const inversePatches: Patch[] = [
        { op: "remove", path: ["components", "123"] },
      ];

      act(() => {
        useHistoryStore.getState().addPatch(patches, inversePatches);
      });

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(1);
      expect(state.past[0].patches).toEqual(patches);
      expect(state.past[0].inversePatches).toEqual(inversePatches);
    });

    it("空补丁不应该被记录", () => {
      act(() => {
        useHistoryStore.getState().addPatch([], []);
      });

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(0);
    });

    it("新操作应该清空 future 栈", () => {
      // 先添加一些历史
      act(() => {
        useHistoryStore
          .getState()
          .addPatch(
            [{ op: "add", path: ["test"], value: 1 }],
            [{ op: "remove", path: ["test"] }]
          );
        useHistoryStore
          .getState()
          .addPatch(
            [{ op: "add", path: ["test2"], value: 2 }],
            [{ op: "remove", path: ["test2"] }]
          );
      });

      // 模拟 undo（直接修改 state 来模拟）
      act(() => {
        const { past } = useHistoryStore.getState();
        const lastPatch = past[past.length - 1];
        useHistoryStore.setState({
          past: past.slice(0, -1),
          future: [lastPatch],
        });
      });

      expect(useHistoryStore.getState().future).toHaveLength(1);

      // 添加新操作应该清空 future
      act(() => {
        useHistoryStore
          .getState()
          .addPatch(
            [{ op: "add", path: ["new"], value: 3 }],
            [{ op: "remove", path: ["new"] }]
          );
      });

      expect(useHistoryStore.getState().future).toHaveLength(0);
    });

    it("当 isApplyingPatches 为 true 时，不应该记录补丁", () => {
      act(() => {
        useHistoryStore.getState().setApplyingPatches(true);
        useHistoryStore
          .getState()
          .addPatch(
            [{ op: "add", path: ["test"], value: 1 }],
            [{ op: "remove", path: ["test"] }]
          );
        useHistoryStore.getState().setApplyingPatches(false);
      });

      expect(useHistoryStore.getState().past).toHaveLength(0);
    });
  });

  describe("clear", () => {
    it("应该清空 past 和 future 栈", () => {
      act(() => {
        useHistoryStore
          .getState()
          .addPatch(
            [{ op: "add", path: ["test"], value: 1 }],
            [{ op: "remove", path: ["test"] }]
          );
      });

      expect(useHistoryStore.getState().past).toHaveLength(1);

      act(() => {
        useHistoryStore.getState().clear();
      });

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(0);
    });
  });

  describe("canUndo / canRedo", () => {
    it("初始状态下 canUndo 和 canRedo 都应为 false", () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it("有历史记录时 canUndo 应为 true", () => {
      act(() => {
        useHistoryStore
          .getState()
          .addPatch(
            [{ op: "add", path: ["test"], value: 1 }],
            [{ op: "remove", path: ["test"] }]
          );
      });

      expect(useHistoryStore.getState().canUndo()).toBe(true);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });
  });
});

describe("useHistoryStore 与 useComponentsStore 集成测试", () => {
  it("添加组件后应该自动记录补丁", () => {
    const pageId = useComponentsStore.getState().rootId;

    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 999, name: "Button", desc: "测试按钮", props: {} },
          pageId
        );
    });

    expect(useHistoryStore.getState().past.length).toBeGreaterThan(0);
  });

  it("删除组件后应该自动记录补丁", () => {
    const pageId = useComponentsStore.getState().rootId;

    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 888, name: "Button", desc: "测试按钮", props: {} },
          pageId
        );
    });

    const pastLengthAfterAdd = useHistoryStore.getState().past.length;

    act(() => {
      useComponentsStore.getState().deleteComponent(888);
    });

    const pastLengthAfterDelete = useHistoryStore.getState().past.length;
    expect(pastLengthAfterDelete).toBeGreaterThan(pastLengthAfterAdd);
  });

  it("updateComponentProps 后应该自动记录补丁", () => {
    const pageId = useComponentsStore.getState().rootId;

    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 777, name: "Button", desc: "测试", props: { text: "原始" } },
          pageId
        );
    });

    const pastLengthBefore = useHistoryStore.getState().past.length;

    act(() => {
      useComponentsStore
        .getState()
        .updateComponentProps(777, { text: "更新后" });
    });

    const pastLengthAfter = useHistoryStore.getState().past.length;
    expect(pastLengthAfter).toBeGreaterThan(pastLengthBefore);
  });

  it("undo 应该回滚组件添加操作", async () => {
    cleanupStores();
    const pageId = useComponentsStore.getState().rootId;

    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 666, name: "Button", desc: "测试", props: {} },
          pageId
        );
    });

    // 确认组件已添加
    expect(useComponentsStore.getState().components[666]).toBeDefined();

    // 执行 undo
    await act(async () => {
      await useHistoryStore.getState().undo();
    });

    // 组件应该被移除
    expect(useComponentsStore.getState().components[666]).toBeUndefined();
  });

  it("redo 应该重新应用已撤销的操作", async () => {
    cleanupStores();
    const pageId = useComponentsStore.getState().rootId;

    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 555, name: "Button", desc: "测试", props: {} },
          pageId
        );
    });

    // undo
    await act(async () => {
      await useHistoryStore.getState().undo();
    });

    expect(useComponentsStore.getState().components[555]).toBeUndefined();

    // redo
    await act(async () => {
      await useHistoryStore.getState().redo();
    });

    expect(useComponentsStore.getState().components[555]).toBeDefined();
  });

  it("多次 undo/redo 应该保持状态一致性", async () => {
    cleanupStores();
    const pageId = useComponentsStore.getState().rootId;

    // 添加 3 个组件
    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 1001, name: "Button", desc: "按钮1", props: {} },
          pageId
        );
    });
    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 1002, name: "Button", desc: "按钮2", props: {} },
          pageId
        );
    });
    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 1003, name: "Button", desc: "按钮3", props: {} },
          pageId
        );
    });

    // 3 个组件都应该存在
    expect(useComponentsStore.getState().components[1001]).toBeDefined();
    expect(useComponentsStore.getState().components[1002]).toBeDefined();
    expect(useComponentsStore.getState().components[1003]).toBeDefined();

    // 撤销 2 次
    await act(async () => {
      await useHistoryStore.getState().undo();
    });
    await act(async () => {
      await useHistoryStore.getState().undo();
    });

    // 只有第一个组件存在
    expect(useComponentsStore.getState().components[1001]).toBeDefined();
    expect(useComponentsStore.getState().components[1002]).toBeUndefined();
    expect(useComponentsStore.getState().components[1003]).toBeUndefined();

    // 重做 1 次
    await act(async () => {
      await useHistoryStore.getState().redo();
    });

    // 前两个组件存在
    expect(useComponentsStore.getState().components[1001]).toBeDefined();
    expect(useComponentsStore.getState().components[1002]).toBeDefined();
    expect(useComponentsStore.getState().components[1003]).toBeUndefined();
  });
});
