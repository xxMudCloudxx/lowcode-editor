// src/editor/materials/DataDisplay/ListItem/meta.tsx
import type { ComponentConfig } from "../../../stores/component-config";

export default {
  name: "ListItem",
  desc: "列表项",
  category: "数据展示",
  defaultProps: {},
  // 只能被放入 List 中
  parentTypes: ["List"],
  setter: [], // 列表项的内容由其子组件决定，暂不开放自身属性
} as Omit<ComponentConfig, "dev" | "prod">;
