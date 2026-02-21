/**
 * @file 特性开关 (Feature Flags)
 * @description
 * 控制实验性/渐进式功能的启用。
 * 当新功能稳定后（通常 1 个迭代），移除对应开关及旧路径代码。
 *
 * 读取优先级：
 * 1. URL 参数 (方便 QA 切换): `?ff.unifiedRenderer=false`
 * 2. localStorage: `ff.unifiedRenderer`
 * 3. 默认值
 *
 * @module Config/FeatureFlags
 */

function readFlag(key: string, defaultValue: boolean): boolean {
  // 1. URL 参数
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const urlVal = params.get(`ff.${key}`);
    if (urlVal === "true") return true;
    if (urlVal === "false") return false;

    // 2. localStorage
    try {
      const stored = localStorage.getItem(`ff.${key}`);
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {
      // localStorage 不可用（iframe sandbox 等）
    }
  }

  // 3. 默认值
  return defaultValue;
}

/**
 * 是否使用统一渲染引擎 SchemaRenderer（@lowcode/renderer）。
 *
 * - `true`（默认）: 使用新的 SchemaRenderer 渲染路径
 * - `false`: 回退到旧的内联 RenderNode 渲染路径
 *
 * 切换方式：
 * - URL: `?ff.unifiedRenderer=false`
 * - 控制台: `localStorage.setItem('ff.unifiedRenderer', 'false')` 然后刷新
 */
export const UNIFIED_RENDERER = readFlag("unifiedRenderer", true);
