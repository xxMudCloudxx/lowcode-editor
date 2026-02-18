/**
 * @file useMergeRefs.ts
 * @description Ref 合并 Hook
 *
 * 解决 cloneElement 时 ref 覆盖问题：
 * 当多个来源都需要访问同一个 DOM 节点时，需要合并所有 ref
 *
 * @example
 * const mergedRef = useMergeRefs(dragRef, externalRef, localRef);
 * return <div ref={mergedRef}>...</div>;
 */

import {
  useCallback,
  type Ref,
  type RefCallback,
  type MutableRefObject,
} from "react";

/**
 * 可以被合并的 Ref 类型
 */
type MergeableRef<T> = Ref<T> | undefined | null;

/**
 * 将值赋给单个 ref
 */
function assignRef<T>(ref: MergeableRef<T>, value: T): void {
  if (ref === null || ref === undefined) {
    return;
  }

  if (typeof ref === "function") {
    // RefCallback 形式
    ref(value);
  } else {
    // MutableRefObject 形式
    (ref as MutableRefObject<T>).current = value;
  }
}

/**
 * 合并多个 ref 为一个 RefCallback
 *
 * @param refs - 要合并的 ref 数组
 * @returns 合并后的 RefCallback，会将值同步到所有传入的 ref
 *
 * @example
 * // 在 cloneElement 时合并原有 ref 和新的 ref
 * const mergedRef = mergeRefs(nodeRef, (children as any).ref);
 * cloneElement(children, { ref: mergedRef });
 */
export function mergeRefs<T>(...refs: MergeableRef<T>[]): RefCallback<T> {
  return (value: T) => {
    refs.forEach((ref) => {
      assignRef(ref, value);
    });
  };
}

/**
 * useMergeRefs - 合并多个 ref 的 Hook 版本
 *
 * 与 mergeRefs 函数的区别：
 * - 使用 useCallback 缓存，避免每次渲染都创建新的 ref callback
 * - 适合在组件内部使用
 *
 * @param refs - 要合并的 ref 数组
 * @returns 稳定的合并后的 RefCallback
 *
 * @example
 * function DraggableNode({ children }) {
 *   const dragRef = useRef(null);
 *   const childRef = (children as any).ref;
 *
 *   const mergedRef = useMergeRefs(dragRef, childRef);
 *
 *   return cloneElement(children, { ref: mergedRef });
 * }
 */
export function useMergeRefs<T>(...refs: MergeableRef<T>[]): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(mergeRefs(...refs), refs);
}
