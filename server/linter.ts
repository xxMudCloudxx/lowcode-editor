/**
 * @file server/linter.ts
 * @description 组件树语义修正器 (Linter)
 *
 * 设计原则：
 * 1. Zod 负责"语法"校验，Linter 负责"语义"修正
 * 2. 自动修复常见的父子约束违规
 * 3. 属性上浮 (Prop Lifting)：将错位的属性移动到正确的组件
 *
 * 核心规则：
 * - Form > Input → Form > FormItem > Input
 * - Grid > Button → Grid > GridColumn > Button
 * - Table > anything → Table > TableColumn > anything
 */
import { v4 as uuidv4 } from "uuid";

// ===== 内部类型定义 =====
// 独立于 schemas.ts，避免循环依赖和类型冲突

export interface LinterNode {
  name: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  children: LinterNode[];
}

// ===== 1. 父子约束规则定义 =====

interface FixRule {
  /** 期望的直接子组件类型 */
  expectedChild: string;
  /** 需要从非法子组件上浮到 Wrapper 的属性名 */
  wrapperPropsLift?: string[];
  /** 创建 Wrapper 时的默认 props */
  wrapperDefaultProps?: Record<string, unknown>;
}

const PARENT_CHILD_RULES: Record<string, FixRule> = {
  // Form 下面必须是 FormItem
  Form: {
    expectedChild: "FormItem",
    // Input 上的 label/name 等属性应该上浮到 FormItem
    wrapperPropsLift: ["label", "name", "rules", "required", "initialValue"],
    wrapperDefaultProps: {},
  },

  // Grid 下面必须是 GridColumn
  Grid: {
    expectedChild: "GridColumn",
    wrapperPropsLift: ["span", "offset", "order", "pull", "push"],
    wrapperDefaultProps: { span: 12 },
  },

  // Table 下面必须是 TableColumn
  Table: {
    expectedChild: "TableColumn",
    wrapperPropsLift: ["title", "dataIndex", "key", "width", "fixed"],
    wrapperDefaultProps: { title: "列", dataIndex: "column" },
  },

  // List 下面必须是 ListItem
  List: {
    expectedChild: "ListItem",
    wrapperPropsLift: [],
    wrapperDefaultProps: {},
  },

  // Tabs 下面必须是 TabPane
  Tabs: {
    expectedChild: "TabPane",
    wrapperPropsLift: ["tab", "label"],
    wrapperDefaultProps: { tab: "标签页" },
  },
};

// ===== 2. 核心修复逻辑 =====

/**
 * 递归修复组件树
 * @param node 待修复的组件节点
 * @returns 修复后的组件节点
 */
export function fixComponentTree(node: LinterNode): LinterNode {
  // 1. 如果没有子节点，确保 children 是空数组
  if (!node.children || node.children.length === 0) {
    return { ...node, children: [] };
  }

  // 2. 检查是否有父子约束规则
  const rule = PARENT_CHILD_RULES[node.name];

  if (rule) {
    // 有约束规则，需要检查并修复每个子节点
    node.children = node.children.map((child) => {
      // 如果子组件已经是期望的类型，递归处理后返回
      if (child.name === rule.expectedChild) {
        return fixComponentTree(child);
      }

      // --- 触发修复逻辑：包裹非法子组件 ---
      console.log(
        `[Linter] 修复结构: 将 ${child.name} 包裹在 ${rule.expectedChild} 中 (父组件: ${node.name})`
      );

      // 创建 Wrapper 组件
      const wrapper: LinterNode = {
        name: rule.expectedChild,
        props: { ...(rule.wrapperDefaultProps || {}) },
        styles: {},
        children: [fixComponentTree(child)], // 递归处理被包裹的节点
      };

      // 属性上浮 (Prop Lifting)
      if (rule.wrapperPropsLift && child.props) {
        for (const propName of rule.wrapperPropsLift) {
          if (child.props[propName] !== undefined) {
            // 将属性从子组件移动到 Wrapper
            wrapper.props[propName] = child.props[propName];
            delete child.props[propName];
            console.log(
              `  └─ 属性上浮: '${propName}' 从 ${child.name} 移动到 ${wrapper.name}`
            );
          }
        }
      }

      return wrapper;
    });
  } else {
    // 没有特殊约束，直接递归处理子节点
    node.children = node.children.map((child) => fixComponentTree(child));
  }

  return node;
}

// ===== 3. 辅助函数 =====

/**
 * 将 AI 生成的 LinterNode 转换为前端所需的 ComponentTree 格式
 * 主要是添加 id 和 parentId 字段
 */
export function convertToComponentTree(
  node: LinterNode,
  parentId: number | null = null,
  idCounter = { value: 1 }
): any {
  const numericId = idCounter.value++;

  const result: any = {
    id: numericId,
    name: node.name,
    desc: node.name, // 使用组件名作为描述
    props: node.props || {},
    styles: node.styles || {},
    parentId,
    children: undefined,
  };

  if (node.children && node.children.length > 0) {
    result.children = node.children.map((child) =>
      convertToComponentTree(child, numericId, idCounter)
    );
  }

  return result;
}
