import React from "react";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterEach,
  vi,
} from "vitest";

vi.mock("antd", () => ({
  __esModule: true,
  Spin: () => <div data-testid="spin" />,
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  message: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
  },
}));

import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { useComponentsStore } from "./components";
import { useHistoryStore } from "./historyStore";
import { useUIStore } from "./uiStore";
import { Preview } from "../components/Preview";
import { useComponentConfigStore } from "./component-config";
import { message } from "antd";

const TestButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { text?: string }
>(({ text, children, ...props }, ref) => (
  <button ref={ref} {...props}>
    {React.Children.count(children) > 0 ? children : text}
  </button>
));

const LazyTestButton = React.lazy(() =>
  Promise.resolve({ default: TestButton })
);

const TestPage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
));

const LazyTestPage = React.lazy(() => Promise.resolve({ default: TestPage }));

let originalComponentConfig: ReturnType<
  typeof useComponentConfigStore.getState
>["componentConfig"];

beforeAll(() => {
  originalComponentConfig = useComponentConfigStore.getState().componentConfig;
});

// 在每个测试用例开始前，重置 store 状态
beforeEach(() => {
  act(() => {
    useComponentsStore.getState().resetComponents();
    useHistoryStore.getState().clear();
    useUIStore.getState().setCurComponentId(null);
    useUIStore.getState().setMode("edit");
    useUIStore.getState().setClipboard(null);
  });
});

describe("useComponentsStore 核心 actions", () => {
  it("addComponent: 应该能向指定的父节点添加一个新组件", () => {
    const initialState = useComponentsStore.getState();
    const pageId = initialState.rootId;

    act(() => {
      useComponentsStore.getState().addComponent(
        {
          id: 123,
          name: "Button",
          desc: "测试按钮",
          props: { text: "初始文本" },
        },
        pageId
      );
    });

    const state = useComponentsStore.getState();
    const page = state.components[pageId];

    expect(page.children).toBeDefined();
    expect(page.children).toHaveLength(1);

    const childId = page.children![0];
    const newButton = state.components[childId];
    expect(newButton.name).toBe("Button");
    expect(newButton.parentId).toBe(pageId);
    expect(newButton.props.text).toBe("初始文本");
  });

  it("deleteComponent: 应该能删除一个组件，如果它有子组件也应一并删除", () => {
    // 准备状态：Page > Container > Button
    act(() => {
      useComponentsStore
        .getState()
        .addComponent({ id: 2, name: "Container", desc: "容器", props: {} }, 1);
      useComponentsStore
        .getState()
        .addComponent({ id: 3, name: "Button", desc: "按钮", props: {} }, 2);
    });

    act(() => {
      useComponentsStore.getState().deleteComponent(2);
    });

    const state = useComponentsStore.getState();
    const page = state.components[1];
    expect(page.children).toEqual([]);
    expect(state.components[2]).toBeUndefined();
    expect(state.components[3]).toBeUndefined();
  });

  it("updateComponentProps: 能够合并更新组件的 props", () => {
    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 101, name: "Button", desc: "按钮", props: { text: "默认" } },
          1
        );
    });

    act(() => {
      useComponentsStore
        .getState()
        .updateComponentProps(101, { text: "更新后", size: "large" });
    });

    const state = useComponentsStore.getState();
    const button = state.components[101];
    expect(button.props).toEqual({ text: "更新后", size: "large" });
  });

  it("updateComponentStyles: 能够合并更新组件的 styles", () => {
    act(() => {
      useComponentsStore.getState().addComponent(
        {
          id: 201,
          name: "Container",
          desc: "容器",
          props: {},
        },
        1
      );
    });

    act(() => {
      useComponentsStore
        .getState()
        .updateComponentStyles(201, { width: 100, height: 50 });
    });

    act(() => {
      useComponentsStore.getState().updateComponentStyles(201, { height: 80 });
    });

    const state = useComponentsStore.getState();
    const container = state.components[201];
    expect(container.styles).toEqual({ width: 100, height: 80 });
  });

  it("resetComponents: 应该能重置画布到初始状态", () => {
    act(() => {
      useComponentsStore
        .getState()
        .addComponent({ id: 301, name: "Button", desc: "按钮", props: {} }, 1);
    });

    act(() => {
      useComponentsStore.getState().resetComponents();
    });

    const state = useComponentsStore.getState();
    expect(Object.keys(state.components)).toHaveLength(1);
    const page = state.components[state.rootId];
    expect(page.name).toBe("Page");
  });

  it("moveComponents: 能够将组件移动到新的父组件下", () => {
    act(() => {
      useComponentsStore
        .getState()
        .addComponent(
          { id: 401, name: "Container", desc: "容器1", props: {} },
          1
        );
      useComponentsStore
        .getState()
        .addComponent(
          { id: 402, name: "Container", desc: "容器2", props: {} },
          1
        );
    });

    act(() => {
      useComponentsStore.getState().moveComponents(401, 402);
    });

    const state = useComponentsStore.getState();
    const container2 = state.components[402];
    expect(container2.children).toContain(401);
    const container1 = state.components[401];
    expect(container1.parentId).toBe(402);
  });

  it("pasteComponents: 能够从剪切板粘贴组件树到指定父节点下", () => {
    // 在剪切板中放入一个简单的树状结构：Container > Button
    act(() => {
      useUIStore.getState().setClipboard({
        id: 1000,
        name: "Container",
        desc: "剪切板容器",
        props: {},
        children: [
          {
            id: 1001,
            name: "Button",
            desc: "剪切板按钮",
            props: { text: "来自剪切板" },
          },
        ],
      });
    });

    act(() => {
      useComponentsStore.getState().pasteComponents(1);
    });

    const state = useComponentsStore.getState();
    const page = state.components[1];
    expect(page.children && page.children.length).toBe(1);

    const pastedContainerId = page.children![0];
    const pastedContainer = state.components[pastedContainerId];
    expect(pastedContainer.name).toBe("Container");
    expect(pastedContainer.parentId).toBe(1);
    expect(pastedContainer.children && pastedContainer.children.length).toBe(1);

    const pastedButtonId = pastedContainer.children![0];
    const pastedButton = state.components[pastedButtonId];
    expect(pastedButton.name).toBe("Button");
    expect(pastedButton.props.text).toBe("来自剪切板");
  });
});

describe("Preview 事件编排", () => {
  afterEach(() => {
    vi.clearAllMocks();
    act(() => {
      useComponentConfigStore.setState({
        componentConfig: originalComponentConfig,
      });
    });
  });

  it("触发 showMessage 动作时能够调用 message.success", async () => {
    act(() => {
      useComponentConfigStore.setState({
        componentConfig: {
          Page: {
            name: "Page",
            desc: "页面",
            defaultProps: {},
            setter: [],
            styleSetter: [],
            events: [],
            component: LazyTestPage,
            editor: {
              isContainer: true,
              parentTypes: [],
            },
          },
          Button: {
            name: "Button",
            desc: "按钮",
            defaultProps: { text: "默认按钮" },
            setter: [],
            styleSetter: [],
            events: [{ name: "onClick", label: "点击事件" }],
            component: LazyTestButton,
            editor: {
              isContainer: false,
              parentTypes: ["Page", "Container"],
            },
          },
        },
      });
    });

    const eventConfig = {
      actions: [
        { type: "showMessage", config: { type: "success", text: "预览触发" } },
      ],
    };

    act(() => {
      useComponentsStore.getState().addComponent(
        {
          id: 501,
          name: "Button",
          desc: "按钮",
          props: {
            text: "触发事件",
            onClick: eventConfig,
          },
        },
        1
      );
    });

    render(<Preview />);

    const button = await screen.findByRole("button", { name: "触发事件" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith("预览触发");
    });
    expect(message.success).toHaveBeenCalledTimes(1);
  });
});
