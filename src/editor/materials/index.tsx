import { lazy, type ComponentType } from "react";
import type { ComponentConfig } from "../stores/component-config";

/**
 * @description 使用 Vite 的 import.meta.glob 功能动态导入所有物料组件。
 *
 * `import.meta.glob` 的问题和解决方案:
 * 1. 默认情况下，不带 eager:true 的 glob 返回的是一个类型为 `Record<string, () => Promise<unknown>>` 的对象。
 * 这里的 `unknown` 类型太宽泛，无法满足 `React.lazy` 的要求。
 * 2. `React.lazy` 需要一个函数，其返回类型为 `Promise<{ default: React.ComponentType<any> }>`。
 * 3. 解决方案: 我们给 `import.meta.glob` 传入一个泛型，明确告诉 TypeScript 每个动态导入的模块都符合 `React.lazy` 的要求。
 */
const metas = import.meta.glob("./**/meta.tsx", {
  eager: true,
  import: "default",
});

// 定义我们期望的模块类型
type LazyComponentModule = { default: ComponentType<any> };

// 通过泛型 <LazyComponentModule> 约束 glob 的返回结果
const devComponents = import.meta.glob<LazyComponentModule>("./**/dev.tsx");
const prodComponents = import.meta.glob<LazyComponentModule>("./**/prod.tsx");

export const materials: ComponentConfig[] = Object.keys(metas).map((key) => {
  const meta = metas[key] as Omit<ComponentConfig, "dev" | "prod">;

  const path = key.replace("/meta.tsx", "");

  return {
    ...meta,
    dev: lazy(devComponents[`${path}/dev.tsx`]),
    prod: lazy(prodComponents[`${path}/prod.tsx`]),
  };
});
