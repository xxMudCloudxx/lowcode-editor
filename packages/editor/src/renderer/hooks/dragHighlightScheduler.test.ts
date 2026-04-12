import { describe, expect, it, vi } from "vitest";

import { createDragHighlightScheduler } from "./dragHighlightScheduler";

describe("createDragHighlightScheduler", () => {
  it("applies the first highlight immediately and throttles later switches", () => {
    vi.useFakeTimers();

    const first = document.createElement("div");
    const second = document.createElement("div");
    const scheduler = createDragHighlightScheduler({
      className: "is-drag-over",
      throttleMs: 24,
    });

    scheduler.schedule(first);
    expect(first.classList.contains("is-drag-over")).toBe(true);

    scheduler.schedule(second);
    expect(first.classList.contains("is-drag-over")).toBe(true);
    expect(second.classList.contains("is-drag-over")).toBe(false);

    vi.advanceTimersByTime(24);
    expect(first.classList.contains("is-drag-over")).toBe(false);
    expect(second.classList.contains("is-drag-over")).toBe(true);

    scheduler.clearNow();
    expect(second.classList.contains("is-drag-over")).toBe(false);

    vi.useRealTimers();
  });
});
