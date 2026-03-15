import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";

const mockStores = vi.hoisted(() => {
  const state = {
    curComponentId: 101 as number | null,
    components: {
      101: {
        id: 101,
        name: "Button",
        desc: "按钮A",
        parentId: 1,
        children: [],
        props: {},
        styles: {
          color: "red",
          width: 100,
        },
      },
      102: {
        id: 102,
        name: "Button",
        desc: "按钮B",
        parentId: 1,
        children: [],
        props: {},
        styles: {
          color: "blue",
        },
      },
    } as Record<number, any>,
    updateComponentStyles: vi.fn(
      (componentId: number, styles: Record<string, any>, replace = false) => {
        const component = state.components[componentId];
        if (!component) {
          return;
        }

        component.styles = replace
          ? { ...styles }
          : { ...component.styles, ...styles };
      },
    ),
  };

  return { state };
});

vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
  }) => (
    <textarea
      aria-label="monaco-editor"
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock("../../stores/uiStore", () => ({
  useUIStore: (selector: (state: { curComponentId: number | null }) => unknown) =>
    selector({
      curComponentId: mockStores.state.curComponentId,
    }),
}));

vi.mock("../../stores/components", () => ({
  useComponentsStore: () => ({
    components: mockStores.state.components,
    updateComponentStyles: mockStores.state.updateComponentStyles,
  }),
  getComponentById: (
    id: number | null,
    components: Record<number, any>,
  ) => (id == null ? null : components[id] ?? null),
}));

import CssEditor from "./ComponentStyle/CssEditor";
import { CustomJS } from "./ComponentEvent/actions/CustomJs";
import { useComponentStyleManager } from "../../hooks/useComponentStyleManager";

describe("Setting 同步行为", () => {
  beforeEach(() => {
    mockStores.state.curComponentId = 101;
    mockStores.state.components = {
      101: {
        id: 101,
        name: "Button",
        desc: "按钮A",
        parentId: 1,
        children: [],
        props: {},
        styles: {
          color: "red",
          width: 100,
        },
      },
      102: {
        id: 102,
        name: "Button",
        desc: "按钮B",
        parentId: 1,
        children: [],
        props: {},
        styles: {
          color: "blue",
        },
      },
    };
    mockStores.state.updateComponentStyles.mockClear();
  });

  it("CustomJS 应该在编辑器里保留注释模板，但写入配置时不带模板注释", () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <CustomJS value={`console.log("saved")`} onChange={handleChange} />,
    );

    expect(
      (screen.getByLabelText("monaco-editor") as HTMLTextAreaElement).value,
    ).toContain('// - ShowMessage("消息内容")  显示成功提示');
    expect(
      (screen.getByLabelText("monaco-editor") as HTMLTextAreaElement).value,
    ).toContain('console.log("saved")');

    rerender(
      <CustomJS value={`console.log("updated")`} onChange={handleChange} />,
    );

    expect(
      (screen.getByLabelText("monaco-editor") as HTMLTextAreaElement).value,
    ).toContain('console.log("updated")');

    rerender(<CustomJS value={undefined} onChange={handleChange} />);

    expect(
      (screen.getByLabelText("monaco-editor") as HTMLTextAreaElement).value,
    ).toContain('// - ShowMessage("消息内容")  显示成功提示');

    rerender(<CustomJS value="" onChange={handleChange} />);

    expect(
      (screen.getByLabelText("monaco-editor") as HTMLTextAreaElement).value,
    ).toContain('// - ShowMessage("消息内容")  显示成功提示');

    fireEvent.change(screen.getByLabelText("monaco-editor"), {
      target: {
        value:
          '// 可用 API:\n// - ShowMessage("消息内容")  显示成功提示\n// - context.name           当前组件名称\n// - context.props          当前组件属性\n// - args                   事件触发时的参数\n\nconsole.log("run");',
      },
    });

    expect(handleChange).toHaveBeenLastCalledWith({
      type: "customJs",
      code: 'console.log("run");',
    });
  });

  it("CssEditor 应在外部 value 变化时同步内容并重置脏状态", () => {
    const handleSave = vi.fn();
    const { rerender } = render(
      <CssEditor value={".comp {\n  color: red;\n}"} onSave={handleSave} />,
    );

    fireEvent.change(screen.getByLabelText("monaco-editor"), {
      target: { value: ".comp {\n  color: blue;\n}" },
    });

    expect(
      (screen.getByRole("button", { name: /保\s*存/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);

    rerender(
      <CssEditor value={".comp {\n  color: green;\n}"} onSave={handleSave} />,
    );

    expect(
      (screen.getByLabelText("monaco-editor") as HTMLTextAreaElement).value,
    ).toBe(".comp {\n  color: green;\n}");
    expect(
      (screen.getByRole("button", { name: /保\s*存/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("useComponentStyleManager 应在切换组件时同步 CSS，并立即保存编辑结果", async () => {
    const form = {
      resetFields: vi.fn(),
      setFieldsValue: vi.fn(),
      getFieldsValue: vi.fn(() => ({ display: "block" })),
    };

    const { result, rerender } = renderHook(() => useComponentStyleManager(form));

    expect(result.current.css).toContain("color: red");
    expect(result.current.css).toContain("width: 100px");

    await waitFor(() => {
      expect(form.setFieldsValue).toHaveBeenCalledWith({
        color: "red",
        width: 100,
      });
    });

    act(() => {
      mockStores.state.curComponentId = 102;
    });
    rerender();

    expect(result.current.css).toContain("color: blue");

    act(() => {
      result.current.handleEditorChange(".comp {\n  color: green;\n}");
    });

    expect(mockStores.state.updateComponentStyles).toHaveBeenCalledWith(
      102,
      {
        color: "green",
        display: "block",
      },
      true,
    );
    expect(mockStores.state.components[102].styles).toEqual({
      color: "green",
      display: "block",
    });
  });
});
