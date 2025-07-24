import { useCallback, type CSSProperties } from "react";

/**
 * @file /src/editor/hooks/useStyleChangeHandler.ts
 * @description 一个用于生成样式更新处理器的自定义 Hook。
 * @module Hooks/useStyleChangeHandler
 */

/**
 * @description 一个封装了通用样式更新逻辑的 Hook。
 * 它返回一个函数，该函数可以为任何 CSS 属性创建一个稳定的、记忆化的 onChange 回调。
 *
 * @param onChange - 从外部传入的、用于更新组件样式的回调函数。
 * @returns {(key: keyof CSSProperties) => (newValue?: any) => void} - 返回一个创建器函数。
 *
 * @example
 * // 在你的组件里:
 * const createChangeHandler = useStyleChangeHandler(props.onChange);
 *
 * // 在 JSX 中使用:
 * <StyleOptionGroup
 * onChange={createChangeHandler('display')}
 * />
 * <StyleColorPicker
 * onChange={createChangeHandler('color')}
 * />
 */
export function useStyleChangeHandler(onChange?: (css: CSSProperties) => void) {
  // 这里使用了 useCallback 来确保返回的 createChangeHandler 函数
  // 以及它内部生成的具体 handler 函数在 onChange 不变的情况下是稳定的，
  // 从而避免不必要的子组件重渲染。
  const createChangeHandler = useCallback(
    (key: keyof CSSProperties) => {
      return (newValue?: any) => {
        // 调用上层传来的 onChange，并传入一个只包含当前修改项的对象
        onChange?.({ [key]: newValue });
      };
    },
    [onChange] // 依赖项是 onChange 函数本身
  );

  return createChangeHandler;
}
