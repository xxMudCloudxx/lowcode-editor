import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VariablePanel } from "./index";
import {
  createInitialExpressionState,
  useExpressionStore,
} from "../../stores/expressionStore";

function resetExpressionStore() {
  localStorage.clear();
  useExpressionStore.setState(createInitialExpressionState());
}

describe("VariablePanel", () => {
  beforeEach(() => {
    resetExpressionStore();
    vi.restoreAllMocks();
  });

  it("adds a page variable from the panel", async () => {
    render(<VariablePanel open onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("变量名，例如 count"), {
      target: { value: "count" },
    });
    fireEvent.change(screen.getByPlaceholderText("默认值，例如 0 / true / hello"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加变量" }));

    await waitFor(() => {
      expect(useExpressionStore.getState().pageVariables).toEqual([
        {
          name: "count",
          defaultValue: 0,
          description: undefined,
        },
      ]);
      expect(useExpressionStore.getState().pageValues).toEqual({ count: 0 });
    });
  }, 10000);

  it("adds a data source from the panel", async () => {
    render(<VariablePanel open onClose={() => {}} />);

    fireEvent.click(screen.getByRole("tab", { name: "数据源" }));

    fireEvent.change(screen.getByPlaceholderText("数据源名称，例如 mockApi"), {
      target: { value: "mockApi" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("接口地址，例如 https://example.com/api"),
      {
        target: { value: "https://example.com/api" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "添加数据源" }));

    await waitFor(() => {
      expect(useExpressionStore.getState().dataSources).toHaveLength(1);
      expect(screen.getByText("$data.mockApi")).toBeTruthy();
    });
  }, 10000);
});
