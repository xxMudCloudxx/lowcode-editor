/**
 * @file 测试数据工厂
 * @description 提供构建最小合法 Schema / IR / Registry 实例的工厂函数。
 *              所有工厂函数支持 partial override。
 */

import type {
  ISchemaNode,
  ISchema,
  IRNode,
  IRPage,
  IRProject,
  IRDependency,
  ICodeGenDescriptor,
  IMaterialCodeGenPack,
  ComponentCodeGenMeta,
} from "@lowcode/schema";
import { CodeGenRegistry } from "../../src/registry/codegen-registry";

// ==========================================
// Schema 工厂
// ==========================================

/**
 * 创建一个最小合法的 ISchemaNode
 */
export function createSchemaNode(
  overrides: Partial<ISchemaNode> = {},
): ISchemaNode {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? "Button",
    ...overrides,
  };
}

/**
 * 创建一个包含 Page 根节点的 ISchema
 */
export function createSchema(
  rootOverrides: Partial<ISchemaNode> = {},
  children?: ISchemaNode[],
): ISchema {
  return [
    createSchemaNode({
      name: "Page",
      id: "page_1",
      children,
      ...rootOverrides,
    }),
  ];
}

// ==========================================
// IR 工厂
// ==========================================

export function createDependency(
  overrides: Partial<IRDependency> = {},
): IRDependency {
  return {
    package: "antd",
    destructuring: true,
    ...overrides,
  };
}

export function createIRNode(overrides: Partial<IRNode> = {}): IRNode {
  return {
    id: overrides.id ?? "node_1",
    componentName: overrides.componentName ?? "Button",
    props: overrides.props ?? {},
    dependency: overrides.dependency ?? createDependency(),
    ...overrides,
  };
}

export function createIRPage(overrides: Partial<IRPage> = {}): IRPage {
  return {
    id: overrides.id ?? "page_1",
    fileName: overrides.fileName ?? "index",
    node: overrides.node ?? createIRNode({ componentName: "Page" }),
    dependencies: overrides.dependencies ?? [],
    ...overrides,
  };
}

export function createIRProject(overrides: Partial<IRProject> = {}): IRProject {
  return {
    pages: overrides.pages ?? [createIRPage()],
    dependencies: overrides.dependencies ?? {},
    ...overrides,
  };
}

// ==========================================
// Registry 工厂
// ==========================================

/**
 * 创建一个最小的 ICodeGenDescriptor
 */
export function createDescriptor(
  overrides: Partial<ICodeGenDescriptor> = {},
): ICodeGenDescriptor {
  return {
    name: overrides.name ?? "Button",
    dependency:
      overrides.dependency ??
      createDependency({ exportName: overrides.name ?? "Button" }),
    ...overrides,
  };
}

/**
 * 创建一个预注册了基础描述符的 CodeGenRegistry 实例
 * @param descriptors 自定义描述符数组，为空则注册默认的 Button + Page
 * @param customLogic 自定义逃生舱映射表
 */
export function createRegistry(
  descriptors?: ICodeGenDescriptor[],
  customLogic?: Record<string, ComponentCodeGenMeta>,
): CodeGenRegistry {
  const registry = new CodeGenRegistry();
  const descs = descriptors ?? [
    createDescriptor({ name: "Button" }),
    createDescriptor({
      name: "Page",
      dependency: createDependency({
        package: "",
        destructuring: false,
      }),
      isContainer: true,
    }),
  ];
  registry.registerDescriptors(descs);
  if (customLogic) {
    for (const [name, logic] of Object.entries(customLogic)) {
      registry.registerCustomLogic(name, logic);
    }
  }
  return registry;
}

/**
 * 创建一个最小的 IMaterialCodeGenPack
 */
export function createMaterialPack(
  overrides: Partial<IMaterialCodeGenPack> = {},
): IMaterialCodeGenPack {
  return {
    descriptors: overrides.descriptors ?? [
      createDescriptor({ name: "Button" }),
      createDescriptor({
        name: "Page",
        dependency: createDependency({
          package: "",
          destructuring: false,
        }),
        isContainer: true,
      }),
    ],
    ...overrides,
  };
}
