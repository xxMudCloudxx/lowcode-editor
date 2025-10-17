import { describe, it, expect, beforeEach, vi } from "vitest";
import { useComponetsStore, getComponentById } from "./components";
import { act } from "@testing-library/react";

// 在每个测试用例开始前，重置 store 状态
beforeEach(() => {
  act(() => {
    // 调用 resetComponents 来确保每个测试都在一个干净的环境中运行
    useComponetsStore.getState().resetComponents();
    // 同时，重置 temporal (撤销/重做) 状态
    useComponetsStore.temporal.getState().clear();
  });
});

describe("useComponetsStore 核心 actions", () => {
  it("addComponent: 应该能向指定的父节点添加一个新组件", () => {
    const initialState = useComponetsStore.getState();
    const pageId = initialState.components[0].id; // 初始 Page 组件的 ID

    act(() => {
      useComponetsStore.getState().addComponent(
        {
          id: 123,
          name: "Button",
          desc: "测试按钮", // 补充 desc 属性
          props: { text: "初始文本" }, // 补充 props 属性
        },
        pageId
      );
    });

    const state = useComponetsStore.getState();
    const page = state.components.find((c) => c.id === pageId);

    expect(page?.children).toBeDefined();
    expect(page?.children).toHaveLength(1);

    const newButton = page?.children?.[0];
    expect(newButton?.name).toBe("Button");
    expect(newButton?.parentId).toBe(pageId);
    expect(newButton?.props.text).toBe("初始文本");
  });

  it("deleteComponent: 应该能删除一个组件，如果它有子组件也应一并删除", () => {
    // 准备状态：Page > Container > Button
    act(() => {
      useComponetsStore
        .getState()
        .addComponent(
          { id: 2, name: "Container", desc: "容器", props: {}, children: [] },
          1
        );
      useComponetsStore
        .getState()
        .addComponent({ id: 3, name: "Button", desc: "按钮", props: {} }, 2);
    });

    // 执行删除
    act(() => {
      useComponetsStore.getState().deleteComponent(2); // 删除 ID 为 2 的容器
    });

    const state = useComponetsStore.getState();
    // 断言 Page 下已经没有子组件
    expect(state.components[0].children).toHaveLength(0);
    // 尝试获取被删除的组件，应返回 null
    expect(getComponentById(2, state.components)).toBeNull();
    expect(getComponentById(3, state.components)).toBeNull();
  });

  it("updateComponentProps: 应该能正确更新指定组件的 props", () => {
    act(() => {
      useComponetsStore
        .getState()
        .addComponent(
          { id: 101, name: "Button", desc: "按钮", props: { text: "旧文本" } },
          1
        );
    });

    act(() => {
      useComponetsStore
        .getState()
        .updateComponentProps(101, { text: "新文本", type: "primary" });
    });

    const state = useComponetsStore.getState();
    const button = getComponentById(101, state.components);

    expect(button?.props.text).toBe("新文本");
    expect(button?.props.type).toBe("primary");
  });

  it("moveComponents: 应该能将一个组件从根目录移动到另一个容器中", () => {
    // 准备初始状态：Page > [Button, Container]
    act(() => {
      useComponetsStore
        .getState()
        .addComponent({ id: 101, name: "Button", desc: "按钮", props: {} }, 1);
      useComponetsStore
        .getState()
        .addComponent(
          { id: 102, name: "Container", desc: "容器", props: {}, children: [] },
          1
        );
    });

    // 将 Button(101) 移动到 Container(102) 中
    act(() => {
      useComponetsStore.getState().moveComponents(101, 102);
    });

    const state = useComponetsStore.getState();
    const page = state.components[0];
    const container = page.children?.find((c) => c.id === 102);

    expect(page.children).toHaveLength(1); // Page 下只剩 Container
    expect(page.children?.[0].id).toBe(102);
    expect(container?.children).toBeDefined();
    expect(container?.children).toHaveLength(1); // Container 下有了 Button
    expect(container?.children?.[0].id).toBe(101);
    expect(container?.children?.[0].parentId).toBe(102);
  });

  it("copyComponents & pasteComponents: 应该能复制一个组件并粘贴到指定容器", () => {
    // 1. 准备一个待复制的组件
    act(() => {
      useComponetsStore
        .getState()
        .addComponent(
          {
            id: 201,
            name: "Input",
            desc: "输入框",
            props: { placeholder: "原始" },
          },
          1
        );
    });

    // 2. 执行复制
    act(() => {
      useComponetsStore.getState().copyComponents(201);
    });

    const clipboardContent = useComponetsStore.getState().clipboard;
    expect(clipboardContent?.id).toBe(201);

    // 3. 执行粘贴
    act(() => {
      useComponetsStore.getState().pasteComponents(1); // 粘贴到 Page
    });

    const state = useComponetsStore.getState();
    const page = state.components[0];
    expect(page.children).toHaveLength(2);

    const pastedComponent = page.children?.find((c) => c.id !== 201);
    expect(pastedComponent).toBeDefined();
    expect(pastedComponent?.id).not.toBe(201); // 关键：ID 必须是新的
    expect(pastedComponent?.name).toBe("Input");
    expect(pastedComponent?.props.placeholder).toBe("原始");
    expect(pastedComponent?.parentId).toBe(1);
  });

  it("setCurComponentId: 应该能正确设置和清除当前选中的组件", () => {
    // Mock temporal 的 pause/resume
    const temporalState = useComponetsStore.temporal.getState();
    const pauseSpy = vi.spyOn(temporalState, "pause");
    const resumeSpy = vi.spyOn(temporalState, "resume");

    // 1. 设置选中
    act(() => {
      useComponetsStore.getState().setCurComponentId(1);
    });

    let state = useComponetsStore.getState();
    expect(state.curComponentId).toBe(1);
    expect(state.curComponent?.name).toBe("Page");
    expect(pauseSpy).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalled();

    // 2. 清除选中
    act(() => {
      useComponetsStore.getState().setCurComponentId(null);
    });

    state = useComponetsStore.getState();
    expect(state.curComponentId).toBeNull();
    expect(state.curComponent).toBeNull();
  });
});
