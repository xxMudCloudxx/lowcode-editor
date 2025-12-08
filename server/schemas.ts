/**
 * @file server/schemas.ts
 * @description AI 生成的 Zod Schema 定义
 *
 * 设计原则：
 * 1. Zod 只负责"语法"校验（JSON 结构正确、组件名合法）
 * 2. 父子约束由 Linter 后处理器负责
 * 3. 避免 Token 爆炸：props 使用 loose record，不做细粒度校验
 */
import { z } from "zod";
import componentNames from "./template/component-names.json";

// ===== 1. 组件名枚举 =====
// 从导出的 component-names.json 动态生成
export const ComponentNameEnum = z.enum(
  componentNames as [string, ...string[]]
);

// ===== 2. 递归组件结构 =====
// 使用 lazy 实现递归定义

interface ComponentNodeType {
  name: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  children: ComponentNodeType[];
}

// 注意：OpenAI Structured Output 不支持 z.record()（会生成 propertyNames）
// 使用 z.any() 作为替代
const BaseComponentSchema = z.object({
  name: ComponentNameEnum.describe("必须是物料库中存在的组件名"),
  props: z.any().describe("组件属性对象"),
  styles: z.any().describe("CSS样式对象"),
});

export const ComponentSchema: z.ZodType<ComponentNodeType> =
  BaseComponentSchema.extend({
    children: z.lazy(() => z.array(ComponentSchema)).describe("子组件列表"),
  });

// ===== 3. 意图分析 Schema (Phase 1) =====
// 核心任务：分析需求，决定需要加载哪些物料
// 注意：OpenAI Structured Output 不支持 .optional()，所有字段必须是 required

export const LayoutTypeEnum = z.enum([
  "Dashboard", // 仪表盘/数据看板
  "Form", // 表单页面
  "List", // 列表/表格页
  "Detail", // 详情页
  "Landing", // 着陆页/营销页
  "Settings", // 设置页
  "Empty", // 空白页
]);

export const IntentSchema = z.object({
  description: z
    .string()
    .describe("对用户需求的简要技术摘要，描述页面的核心功能"),
  // 关键字段：用于从 materials-ai.json 中"召回"组件
  suggestedComponents: z
    .array(z.string())
    .describe("预测实现该页面所需的组件列表，如 Button, Form, Table 等"),
  layoutType: LayoutTypeEnum.describe("页面整体布局类型"),
});

// ===== 4. 页面生成 Schema (Phase 2) =====
// 核心任务：基于召回的物料，生成最终 DOM 树

export const PageSchema = z.object({
  reasoning: z
    .string()
    .describe("生成布局的思维链：先思考容器结构，再填充组件"),
  // 根节点：通常是 Page 或 Container
  root: ComponentSchema.describe("页面根节点，通常 name 为 Page"),
});

// ===== 5. 类型导出 =====
export type IntentResult = z.infer<typeof IntentSchema>;
export type PageResult = z.infer<typeof PageSchema>;
export type ComponentNode = ComponentNodeType;
