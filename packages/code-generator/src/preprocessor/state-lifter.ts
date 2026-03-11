/**
 * @file 组件方法状态提升预处理器
 * @description 遍历 IR 树，查找 componentMethod 动作，将其提升为页面级的状态与方法，并重写相关 Action 配置。
 */
// src/code-generator/preprocessor/state-lifter.ts

import { upperFirst } from "lodash-es";
import type { CodeGenRegistry } from "../registry/codegen-registry";
import type {
  IRProject,
  IRNode,
  IRAction,
  IRStateUpdater,
  IRStateRef,
  IRMethodRef,
  IRLiteral,
  IRPage,
} from "@lowcode/schema";
import { buildIrNodeMap, isIRActionArray } from "../utils/ir-helper";

/**
 * 遍历并转换单个页面的 IR 树
 * @param page - 整个 IRPage 对象
 */
function transformPage(page: IRPage, registry: CodeGenRegistry): IRPage {
  // 1. 构建一个 IRNode 映射表
  const irNodeMap = new Map<number | string, IRNode>();
  buildIrNodeMap(page.node, irNodeMap); // 从页面的根节点开始构建

  // 2. 执行转换 (现在传入整个 page 对象)
  transformComponentMethods(page, irNodeMap, registry);

  return page;
}

/**
 * 核心转换逻辑：遍历 IR 树，查找并转换 componentMethod
 * @param page - 整个 IRPage 对象 (用于注入 states/methods)
 * @param irNodeMap - IR 节点映射表
 */
function transformComponentMethods(
  page: IRPage,
  irNodeMap: Map<number | string, IRNode>,
  registry: CodeGenRegistry,
) {
  const traverse = (irNode: IRNode) => {
    // 1. 遍历当前节点的所有 Props
    for (const [key, propValue] of Object.entries(irNode.props)) {
      let actions: IRAction[] = [];
      if (propValue && (propValue as IRAction).type === "Action") {
        actions = [propValue as IRAction];
      } else if (isIRActionArray(propValue)) {
        actions = propValue as IRAction[];
      }

      if (actions.length > 0) {
        // 2. 过滤和转换 Action
        const newActions: IRAction[] = actions
          .map((action) => {
            if (action.actionType === "componentMethod") {
              // 3. 发现 componentMethod，执行状态提升
              return liftComponentMethod(action, page, irNodeMap, registry);
            }
            return action; // 保留其他类型的 action
          })
          .filter((action): action is IRAction => !!action); // 过滤掉返回 null 的

        // 4. 用转换后的 action 数组替换旧的 prop（空数组则剪枝删除）
        if (newActions.length === 0) {
          delete irNode.props[key];
        } else {
          irNode.props[key] =
            newActions.length === 1 ? newActions[0] : newActions;
        }
      }
    }

    // 5. 递归遍历子节点和 JSSlot...
    if (irNode.children) {
      irNode.children.forEach(traverse);
    }
    // ... (JSSlot 递归逻辑) ...
    for (const prop of Object.values(irNode.props)) {
      if (prop && typeof prop === "object") {
        if ((prop as IRNode).componentName) {
          traverse(prop as IRNode);
        } else if (
          Array.isArray(prop) &&
          prop[0] &&
          (prop[0] as IRNode).componentName
        ) {
          for (const node of prop as IRNode[]) {
            traverse(node);
          }
        }
      }
    }
  };

  traverse(page.node); // 从页面的根节点开始遍历
}

/**
 * 状态提升的具体实现 (已修复 TypeScript 错误)
 * @param action
 * @param page - 整个 IRPage 对象 [!> 签名变更 <!]
 * @param irNodeMap
 * @returns
 */
function liftComponentMethod(
  action: IRAction,
  page: IRPage,
  irNodeMap: Map<number | string, IRNode>,
  registry: CodeGenRegistry,
): IRAction | null {
  const config = action.config;
  const targetComponentId = config.componentId;
  const targetMethod = config.method;

  if (!targetComponentId || !targetMethod) {
    console.warn(`[StateLifter] 动作缺少 componentId 或 method。`, action);
    return null;
  }

  // 1. 查找目标组件 (Modal)
  const targetIrNode = irNodeMap.get(targetComponentId);
  if (!targetIrNode) {
    console.warn(
      `[StateLifter] 未找到 componentMethod 的目标组件 ID: ${targetComponentId}`,
    );
    return null;
  }

  // 2. 查询元数据 (Modal.methods.open) —— 从 CodeGenRegistry 获取
  const metadata = registry.getMetadata(targetIrNode.componentName);
  if (!metadata) {
    console.warn(
      `[StateLifter] 组件 ${targetIrNode.componentName} 的方法 ${targetMethod} 没有定义 stateBinding。`,
    );
    return null;
  }
  const methodMeta = metadata.methods?.find((m) => m.name === targetMethod);

  if (!methodMeta || !methodMeta.stateBinding) {
    console.warn(
      `[StateLifter] 组件 ${targetIrNode.componentName} 的方法 ${targetMethod} 没有定义 stateBinding。`,
    );
    return null;
  }

  // 3. 确定 State 和 Method 名称
  const statePropName = methodMeta.stateBinding.prop; // 'visible'
  const stateValue = methodMeta.stateBinding.value; // true
  const stateName = `${statePropName}_${targetComponentId}`; // e.g., "visible_1761401141684"
  const methodName = `handle${upperFirst(targetMethod)}_${targetComponentId}`; // e.g., "open_1761401141684"

  // 4. 注入 State 和 Method 到 page 对象
  if (!page.states) page.states = {};
  if (!page.methods) page.methods = {};

  // 注入 State (如果尚不存在)
  if (!page.states[stateName]) {
    page.states[stateName] = {
      type: "Literal",
      value: false, // 弹窗/抽屉等默认值应为 false
    } as IRLiteral;
  }

  // 注入 Method (e.g., handleOpen_modal_100) — 结构化描述"设置 state 为 value"
  page.methods[methodName] = {
    type: "StateUpdater",
    stateName,
    value: stateValue,
  } as IRStateUpdater;

  // 5. 绑定目标组件 Prop (visible → 引用 state)
  targetIrNode.props[statePropName] = {
    type: "StateRef",
    stateName,
  } as IRStateRef;

  // 6. 自动绑定关闭方法 (onCancel, onOk)
  metadata.methods?.forEach((meta) => {
    if (
      meta.stateBinding?.prop === statePropName &&
      meta.stateBinding.value === false &&
      meta.eventBinding
    ) {
      const mName = `handle${upperFirst(meta.name)}_${targetComponentId}`;

      // 确保 close method 也被创建
      if (!page.methods![mName]) {
        page.methods![mName] = {
          type: "StateUpdater",
          stateName,
          value: false,
        } as IRStateUpdater;
      }

      // 绑定到事件 (e.g., onCancel → 引用 close method)
      targetIrNode.props[meta.eventBinding] = {
        type: "MethodRef",
        methodName: mName,
      } as IRMethodRef;
    }
  });

  // 7. 返回一个新的 'callMethod' Action
  return {
    type: "Action",
    actionType: "callMethod",
    config: {
      methodName,
    },
  };
}

/**
 * 预处理器主函数：StateLifter
 * @param irProject - 原始的 IRProject
 * @returns 转换后的 IRProject
 */
export function runStateLifter(
  irProject: IRProject,
  registry: CodeGenRegistry,
): IRProject {
  // 遍历所有页面，对每个页面的 IR 树进行转换
  irProject.pages.forEach((page) => {
    transformPage(page, registry);
  });

  return irProject;
}

/**
 * StateLifter 预处理器（IPreprocessor 格式）
 * 可直接在 ISolution.preprocessors 中使用。
 */
import type { IPreprocessor } from "@lowcode/schema";
export const stateLifterPreprocessor: IPreprocessor = {
  name: "state-lifter",
  run: (irProject, { registry }) => runStateLifter(irProject, registry),
};
