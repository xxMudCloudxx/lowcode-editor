interface DragHighlightSchedulerOptions {
  className: string;
  throttleMs: number;
  onApply?: (el: HTMLElement | null) => void;
}

export function createDragHighlightScheduler({
  className,
  throttleMs,
  onApply,
}: DragHighlightSchedulerOptions) {
  let currentEl: HTMLElement | null = null;
  let pendingEl: HTMLElement | null | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastAppliedAt = 0;

  function apply(el: HTMLElement | null) {
    if (currentEl === el) return;

    if (currentEl) {
      currentEl.classList.remove(className);
    }
    if (el) {
      el.classList.add(className);
    }

    currentEl = el;
    lastAppliedAt = Date.now();
    onApply?.(el);
  }

  function flushLatest() {
    timeoutId = null;
    if (pendingEl === undefined) return;

    const nextEl = pendingEl;
    pendingEl = undefined;
    apply(nextEl ?? null);
  }

  return {
    schedule(el: HTMLElement | null) {
      if (currentEl === null) {
        pendingEl = undefined;
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        apply(el);
        return;
      }

      const elapsed = Date.now() - lastAppliedAt;
      if (elapsed >= throttleMs) {
        pendingEl = undefined;
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        apply(el);
        return;
      }

      pendingEl = el;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(flushLatest, throttleMs - elapsed);
    },
    clearNow() {
      pendingEl = undefined;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      apply(null);
    },
    dispose() {
      this.clearNow();
    },
  };
}
