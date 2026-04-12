import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RendererSelectedMask } from "./RendererSelectedMask";
import { useRendererStore } from "../stores/rendererStore";

const rootComponent = {
  id: 1,
  name: "Page",
  props: {},
  desc: "Page",
  parentId: null,
  children: [2],
};

const childComponent = {
  id: 2,
  name: "Button",
  props: {},
  desc: "Button",
  parentId: 1,
  children: [],
};

describe("RendererSelectedMask", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 16);
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      window.clearTimeout(id);
    });

    useRendererStore.setState({
      components: {
        1: { ...rootComponent },
        2: { ...childComponent },
      },
      rootId: 1,
      version: 0,
      curComponentId: 2,
      mode: "edit",
      draggingMaterial: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("re-measures on the next frame after component tree updates", () => {
    render(
      <div className="simulator-container">
        <div className="portal-wrapper" />
        <div data-component-id="2">Selected node</div>
      </div>,
    );

    render(
      <RendererSelectedMask
        portalWrapperClassName="portal-wrapper"
        containerClassName="simulator-container"
        componentId={2}
      />,
    );

    const container = document.querySelector(
      ".simulator-container",
    ) as HTMLDivElement;
    const node = document.querySelector(
      '[data-component-id="2"]',
    ) as HTMLDivElement;
    const portalWrapper = document.querySelector(
      ".portal-wrapper",
    ) as HTMLDivElement;

    Object.defineProperty(container, "scrollTop", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(container, "scrollLeft", {
      configurable: true,
      value: 0,
    });

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1200,
      bottom: 800,
      width: 1200,
      height: 800,
      toJSON: () => ({}),
    });

    const leftSequence = [10, 240];
    let measureIndex = 0;
    vi.spyOn(node, "getBoundingClientRect").mockImplementation(() => {
      const left = leftSequence[Math.min(measureIndex, leftSequence.length - 1)];
      measureIndex += 1;

      return {
        x: left,
        y: 24,
        top: 24,
        left,
        right: left + 120,
        bottom: 64,
        width: 120,
        height: 40,
        toJSON: () => ({}),
      };
    });

    act(() => {
      useRendererStore.setState({
        components: {
          1: { ...rootComponent },
          2: { ...childComponent, parentId: 99 },
        },
        version: 1,
      });
    });

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const mask = portalWrapper.firstElementChild as HTMLDivElement;
    expect(mask.style.left).toBe("240px");
  });
});
