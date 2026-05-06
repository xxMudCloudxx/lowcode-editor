import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { useExpressionStore, createInitialExpressionState } from "./expressionStore";

function resetExpressionStore() {
  localStorage.clear();
  useExpressionStore.setState(createInitialExpressionState());
}

describe("useExpressionStore", () => {
  beforeEach(() => {
    resetExpressionStore();
    vi.restoreAllMocks();
  });

  it("buildContext should assemble all five scopes", () => {
    act(() => {
      useExpressionStore.getState().addVariable("global", {
        name: "appName",
        defaultValue: "lowcode",
      });
      useExpressionStore.getState().addVariable("page", {
        name: "count",
        defaultValue: 1,
      });
      useExpressionStore.getState().setPageVariable("count", 3);
    });

    const context = useExpressionStore.getState().buildContext({
      title: "Button",
    });

    expect(context.$global).toEqual({ appName: "lowcode" });
    expect(context.$page).toEqual({ count: 3 });
    expect(context.$data).toEqual({});
    expect(context.$props).toEqual({ title: "Button" });
    expect(context.$system).toMatchObject({
      pathname: window.location.pathname,
    });
  });

  it("setPageVariable should update the built context", () => {
    act(() => {
      useExpressionStore.getState().addVariable("page", {
        name: "status",
        defaultValue: "draft",
      });
      useExpressionStore.getState().setPageVariable("status", "published");
    });

    expect(useExpressionStore.getState().buildContext().$page).toEqual({
      status: "published",
    });
  });

  it("fetchDataSource should update dataValues after request success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ title: "Mock Title" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    act(() => {
      useExpressionStore.getState().addDataSource({
        id: "mock-api",
        name: "mockApi",
        url: "https://example.com/api",
        method: "GET",
        autoFetch: true,
      });
    });

    await useExpressionStore.getState().fetchDataSource("mock-api");

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
    expect(useExpressionStore.getState().dataValues).toEqual({
      mockApi: { title: "Mock Title" },
    });
  });
});
