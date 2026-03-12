/**
 * @file renderer/hooks/useDelegatedDnD.ts
 * @description
 * Iframe 侧事件委托式 DnD Hook。
 * 在画布容器级别注册单组事件监听器（dragstart / dragover / drop / dragend / dragleave），
 * 通过 data-* 属性识别拖拽源和放置目标，替代为每个节点注册独立 useDrag / useDrop 的模式。
 *
 * 优势：
 * - O(1) 事件监听器，而非 O(N)，彻底消除深层嵌套的性能问题
 * - 高亮指示通过直接 DOM 操作（dataset），不触发 React re-render
 * - 不依赖 react-dnd，iframe 侧无需 DndProvider
 *
 * @module Renderer/Hooks/useDelegatedDnD
 */

import { useEffect, useRef } from "react";
import { useRendererStore } from "../stores/rendererStore";
import { simulatorRenderer } from "../../editor/simulator/SimulatorRenderer";
import { materials, type ComponentConfig } from "@lowcode/materials";

// ==================== 物料配置 Map ====================

const componentConfigMap: Record<string, ComponentConfig> = {};
for (const m of materials) {
  componentConfigMap[m.name] = m;
}

// ==================== DOM 查找工具 ====================

/**
 * 从事件目标向上查找最近的组件节点（含 data-component-id）
 */
function findComponentEl(
  target: EventTarget | null,
  boundary: HTMLElement,
): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el && el !== boundary) {
    if (el.dataset?.componentId) return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * 从事件目标向上查找最近的容器组件节点
 * 拖拽期间 pointer-events 仅对 [data-is-container] 启用，
 * 所以 e.target 本身大概率就是容器，向上查找仅需 0-2 层。
 */
function findContainerEl(
  target: EventTarget | null,
  boundary: HTMLElement,
): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el && el !== boundary) {
    if (el.dataset?.componentId && el.dataset.isContainer === "true") return el;
    el = el.parentElement;
  }
  return null;
}

// ==================== 校验工具 ====================

/**
 * 检查 targetId 是否是 sourceId 的后代（防止循环嵌套）
 */
function isDescendant(
  targetId: number,
  sourceId: number,
  components: Record<number, { parentId?: number | null }>,
): boolean {
  let current = components[targetId];
  while (current && current.parentId != null) {
    if (current.parentId === sourceId) return true;
    current = components[current.parentId];
  }
  return false;
}

/**
 * 检查 draggedComponentName 是否允许放入 containerName
 * 基于物料配置的 parentTypes 声明
 */
function canAccept(
  draggedComponentName: string,
  containerName: string,
): boolean {
  const config = componentConfigMap[draggedComponentName];
  return config?.editor.parentTypes?.includes(containerName) ?? false;
}

// ==================== Hook ====================

interface DragState {
  /** 内部拖拽时被拖动的组件 ID（外部拖入时为 null） */
  dragId: number | null;
  /** 被拖动组件的类型名 */
  dragName: string | null;
  /** 当前高亮的容器 DOM 节点 */
  currentOverEl: HTMLElement | null;
  /** 上一次 dragover 事件目标（引用比较跳过重复处理） */
  lastTarget: EventTarget | null;
  /** 上一次 target 是否命中有效放置区 */
  lastTargetValid: boolean;
}

/**
 * Iframe 侧事件委托式 DnD Hook。
 * 绑定在画布容器元素上，通过冒泡统一处理所有组件的拖拽交互。
 *
 * @param containerRef - 画布容器（simulator-container）的 ref
 * @returns isDraggingRef - 当前是否处于拖拽中（供外部抑制无关更新）
 */
export function useDelegatedDnD(
  containerRef: React.RefObject<HTMLElement | null>,
): React.RefObject<boolean> {
  const isDraggingRef = useRef(false);
  const stateRef = useRef<DragState>({
    dragId: null,
    dragName: null,
    currentOverEl: null,
    lastTarget: null,
    lastTargetValid: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = stateRef.current;

    /**
     * 挂起的高亮目标 — 由 dragover 同步写入，由 RAF 异步消费刷新 DOM。
     * 使用哨兵值区分 "无变更" / "清除高亮" / "设置高亮"。
     */
    let pendingHighlight: HTMLElement | null | undefined; // undefined = 无变更
    let rafId = 0;

    function flushHighlight() {
      rafId = 0;
      if (pendingHighlight === undefined) return;
      if (pendingHighlight === null) {
        // 清除
        if (state.currentOverEl) {
          delete state.currentOverEl.dataset.isOver;
          state.currentOverEl = null;
        }
      } else {
        // 设置
        if (state.currentOverEl === pendingHighlight) {
          pendingHighlight = undefined;
          return;
        }
        if (state.currentOverEl) {
          delete state.currentOverEl.dataset.isOver;
        }
        pendingHighlight.dataset.isOver = "true";
        state.currentOverEl = pendingHighlight;
      }
      pendingHighlight = undefined;
    }

    function scheduleHighlight(el: HTMLElement | null) {
      pendingHighlight = el;
      if (!rafId) {
        rafId = requestAnimationFrame(flushHighlight);
      }
    }

    // ---- 高亮管理（立即版本，用于 drop/dragend 等需要即时清理的场景） ----

    function clearHighlightNow() {
      pendingHighlight = undefined;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (state.currentOverEl) {
        delete state.currentOverEl.dataset.isOver;
        state.currentOverEl = null;
      }
    }

    // ---- dragstart: 画布内组件开始拖拽 ----

    function handleDragStart(e: DragEvent) {
      const compEl = findComponentEl(e.target, container);
      if (!compEl) return;

      const id = +compEl.dataset.componentId!;

      // 根组件（Page）不允许拖动
      if (id === 1) {
        e.preventDefault();
        return;
      }

      state.dragId = id;
      state.dragName = compEl.dataset.componentType || null;
      state.lastTarget = null;
      state.lastTargetValid = false;
      isDraggingRef.current = true;
      container.classList.add("is-dragging");

      e.dataTransfer!.effectAllowed = "move";
      e.dataTransfer!.setData("text/plain", `lowcode-move:${id}`);
    }

    // ---- dragover: 判断放置目标并显示指示（三层缓存 + RAF 高亮节流） ----

    function handleDragOver(e: DragEvent) {
      // 任何 dragover 都意味着正在拖拽（含外部物料拖入）
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        container.classList.add("is-dragging");
      }

      const target = e.target;

      // ── 第一层：完全相同的 target → 直接复用上次结果 ──
      // dragover 在鼠标微动/静止时高频触发同一 target，
      // 引用比较 O(1) 可跳过绝大多数事件。
      if (target === state.lastTarget) {
        if (state.lastTargetValid) {
          e.preventDefault();
          e.dataTransfer!.dropEffect = state.dragId !== null ? "move" : "copy";
        }
        return;
      }
      state.lastTarget = target;

      // ── 第二层：DOM 向上查找容器（O(depth)，典型 5-15 层） ──
      const containerEl = findContainerEl(target, container);
      if (!containerEl) {
        scheduleHighlight(null);
        state.lastTargetValid = false;
        return;
      }

      // ── 同一容器 → 跳过校验 ──
      if (containerEl === state.currentOverEl) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = state.dragId !== null ? "move" : "copy";
        state.lastTargetValid = true;
        return;
      }

      // ── 第三层：完整校验路径（仅在切换到新容器时执行） ──

      const containerId = +containerEl.dataset.componentId!;
      const containerName = containerEl.dataset.componentType || "";

      let draggedName: string | null = null;

      if (state.dragId !== null) {
        // 内部拖拽
        draggedName = state.dragName;

        // 禁止自我嵌套
        if (state.dragId === containerId) {
          state.lastTargetValid = false;
          return;
        }

        // 禁止循环嵌套（扁平结构 O(depth) 遍历，无需缓存）
        const components = useRendererStore.getState().components;
        if (isDescendant(containerId, state.dragId, components)) {
          state.lastTargetValid = false;
          return;
        }
      } else {
        // 外部拖入（物料面板 → iframe）
        const draggingMaterial = useRendererStore.getState().draggingMaterial;
        draggedName = draggingMaterial?.componentName ?? null;
      }

      if (!draggedName) {
        state.lastTargetValid = false;
        return;
      }

      // parentTypes 校验
      if (!canAccept(draggedName, containerName)) {
        scheduleHighlight(null);
        state.lastTargetValid = false;
        return;
      }

      e.preventDefault();
      e.dataTransfer!.dropEffect = state.dragId !== null ? "move" : "copy";
      // 高亮切换通过 RAF 节流 — 避免快速扫过容器时逐帧触发 DOM 变更 + 样式重算
      scheduleHighlight(containerEl);
      state.lastTargetValid = true;
    }

    // ---- drop: 执行放置操作 ----

    function handleDrop(e: DragEvent) {
      e.preventDefault();
      clearHighlightNow();
      isDraggingRef.current = false;
      container.classList.remove("is-dragging");

      const containerEl = findContainerEl(e.target, container);
      if (!containerEl) return;

      const containerId = +containerEl.dataset.componentId!;
      const containerName = containerEl.dataset.componentType || "";

      if (state.dragId !== null) {
        // ---- 内部移动 ----
        if (!state.dragName || !canAccept(state.dragName, containerName))
          return;
        if (state.dragId === containerId) return;

        const components = useRendererStore.getState().components;
        if (isDescendant(containerId, state.dragId, components)) return;

        simulatorRenderer.dispatchAction(
          "moveComponents",
          state.dragId,
          containerId,
        );
      } else {
        // ---- 外部放入（物料面板 → 画布） ----
        const draggingMaterial = useRendererStore.getState().draggingMaterial;
        if (!draggingMaterial) return;
        if (!canAccept(draggingMaterial.componentName, containerName)) return;

        simulatorRenderer.dispatchAction(
          "addComponent",
          {
            desc: draggingMaterial.desc,
            id: Date.now(),
            name: draggingMaterial.componentName,
            props: draggingMaterial.defaultProps,
          },
          containerId,
        );
      }
    }

    // ---- dragend: 清理状态 ----

    function handleDragEnd() {
      state.dragId = null;
      state.dragName = null;
      clearHighlightNow();
      state.lastTarget = null;
      state.lastTargetValid = false;
      isDraggingRef.current = false;
      container.classList.remove("is-dragging");
    }

    // ---- dragleave: 拖拽离开画布边界时清理高亮 ----

    function handleDragLeave(e: DragEvent) {
      if (!container.contains(e.relatedTarget as Node)) {
        clearHighlightNow();
        state.lastTarget = null;
        state.lastTargetValid = false;
        isDraggingRef.current = false;
        container.classList.remove("is-dragging");
      }
    }

    // ---- 注册事件 ----

    container.addEventListener("dragstart", handleDragStart);
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("dragend", handleDragEnd);
    container.addEventListener("dragleave", handleDragLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener("dragstart", handleDragStart);
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
      container.removeEventListener("dragend", handleDragEnd);
      container.removeEventListener("dragleave", handleDragLeave);
    };
  }, [containerRef]);

  return isDraggingRef;
}
