/**
 * @file /src/editor/materials/index.tsx
 * @description
 * 物料系统的“自动化注册中心”。
 * 本文件利用 Vite 的 `import.meta.glob` 功能，动态地、自动化地扫描 `/materials` 目录下
 * 所有符合规范的物料组件（即包含 `meta.tsx`, `dev.tsx`, `prod.tsx` 的文件夹），
 * 并将它们整合成一个 `materials` 配置数组，供整个应用使用。
 * 这种设计极大地简化了新增物料的流程，开发者只需创建物料文件，无需修改任何注册代码。
 * @module Materials/Index
 */
import { lazy, type ComponentType } from "react";
import type { ComponentConfig } from "../stores/component-config";

/**
 * @description 动态、同步地导入所有物料的 `meta.tsx` 文件。
 * - `eager: true`: 表示这是一个“急切”的导入，Vite 会在构建时将这些模块直接打包进来，而不是生成动态 `import()`。
 * 这确保了 `metas` 变量在模块加载时就立即包含了所有配置数据。
 * - `import: "default"`: 指定我们只关心每个 `meta.tsx` 模块的 `default` 导出。
 */
const metas = import.meta.glob("./**/meta.tsx", {
  eager: true,
  import: "default",
});

/**
 * @description `import.meta.glob` 的问题和解决方案:
 * 1. 问题: 默认情况下，不带 `eager:true` 的 `glob` 返回一个类型为 `Record<string, () => Promise<unknown>>` 的对象。
 * 这里的 `unknown` 类型太宽泛，无法直接传递给 `React.lazy`。
 * 2. `React.lazy` 的要求: `React.lazy` 需要一个返回 `Promise<{ default: React.ComponentType<any> }>` 的函数。
 * 3. 解决方案: 我们为 `import.meta.glob` 传入一个泛型 `<LazyComponentModule>`，明确地告诉 TypeScript
 * 每个动态导入的模块都符合 `React.lazy` 的要求，从而解决了类型不匹配的问题。
 */
type LazyComponentModule = { default: ComponentType<any> };

// 动态地、懒加载地导入所有物料的 `dev.tsx` 组件、`prod.tsx`组件
const devComponents = import.meta.glob<LazyComponentModule>("./**/dev.tsx");
const prodComponents = import.meta.glob<LazyComponentModule>("./**/prod.tsx");

/**
 * @description 最终导出的、包含了所有物料完整配置的数组。
 * 这是整个低代码编辑器的“物料库”。
 */
export const materials: ComponentConfig[] = Object.keys(metas).map((key) => {
  // 从同步导入的 `metas` 对象中获取物料的元数据
  const meta = metas[key] as Omit<ComponentConfig, "dev" | "prod">;

  // 根据 `meta.tsx` 的路径推断出 `dev.tsx` 和 `prod.tsx` 的路径
  const path = key.replace("/meta.tsx", "");

  // 组装成一个完整的 ComponentConfig 对象
  return {
    ...meta,
    // 使用 React.lazy 包裹异步导入的组件，实现代码分割
    dev: lazy(devComponents[`${path}/dev.tsx`]),
    prod: lazy(prodComponents[`${path}/prod.tsx`]),
  };
});
