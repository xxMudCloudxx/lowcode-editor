import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockStores = vi.hoisted(() => {
  const state = {
    curComponentId: 101 as number | null,
    components: {
      101: {
        id: 101,
        name: "Button",
        desc: "按钮",
        parentId: 1,
        children: [],
        props: {
          text: "默认文案",
        },
      },
    } as Record<number, any>,
    updateComponentProps: vi.fn(
      (componentId: number, props: Record<string, unknown>, replace = false) => {
        const component = state.components[componentId];
        if (!component) return;

        component.props = replace
          ? props
          : {
              ...component.props,
              ...props,
            };
      },
    ),
    updateComponentDesc: vi.fn((componentId: number, desc: string) => {
      const component = state.components[componentId];
      if (!component) return;
      component.desc = desc;
    }),
  };

  return { state };
});

vi.mock("../../../stores/uiStore", () => ({
  useUIStore: (selector: (state: { curComponentId: number | null }) => unknown) =>
    selector({ curComponentId: mockStores.state.curComponentId }),
}));

vi.mock("../../../stores/components", () => ({
  useComponentsStore: () => ({
    components: mockStores.state.components,
    updateComponentProps: mockStores.state.updateComponentProps,
    updateComponentDesc: mockStores.state.updateComponentDesc,
  }),
  getComponentById: (
    id: number | null,
    components: Record<number, any>,
  ) => (id == null ? null : components[id] ?? null),
}));

vi.mock("../../../stores/component-config", () => ({
  useComponentConfigStore: () => ({
    componentConfig: {
      Button: {
        name: "Button",
        desc: "按钮",
        component: () => null,
        defaultProps: {},
        editor: {},
        setter: [{ name: "text", label: "文本", type: "input" }],
      },
    },
  }),
}));

vi.mock("../../../stores/expressionStore", () => ({
  useExpressionStore: (selector: (state: any) => unknown) =>
    selector({
      buildContext: () => ({
        $global: {},
        $page: { title: "预览标题" },
        $data: {},
        $props: {},
        $system: {},
      }),
      globalVariables: [],
      pageVariables: [{ name: "title", defaultValue: "预览标题" }],
      dataSources: [],
    }),
}));

import { ComponentAttr } from "./index";

describe("ComponentAttr expression binding", () => {
  beforeEach(() => {
    mockStores.state.curComponentId = 101;
    mockStores.state.components = {
      101: {
        id: 101,
        name: "Button",
        desc: "按钮",
        parentId: 1,
        children: [],
        props: {
          text: "默认文案",
        },
      },
    };
    mockStores.state.updateComponentProps.mockClear();
  });

  it("switches a field into expression mode and writes JSExpression back to props", async () => {
    render(<ComponentAttr />);

    fireEvent.click(screen.getByRole("button", { name: "切换为表达式绑定" }));

    const textarea = screen.getByPlaceholderText('$page.count + " 次点击"');
    fireEvent.change(textarea, {
      target: { value: "$page.title" },
    });

    await waitFor(() => {
      expect(mockStores.state.updateComponentProps).toHaveBeenCalledWith(
        101,
        {
          text: {
            type: "JSExpression",
            value: "$page.title",
          },
        },
        true,
      );
    });
  }, 10000);
});
