// src/code-generator/registry/codegen-registry.ts

/**
 * @file 出码元数据注册表
 * @description 统一管理物料的出码描述符（ICodeGenDescriptor）和程序式逃生舱。
 * 提供声明式数据 → 运行时函数的"通用解释器"能力。
 *
 * 消费者：
 * - SchemaParser（查 dependency / componentName）
 * - JsxPlugin / VueTemplatePlugin（查 tagName / propTransforms / logicFragments）
 */

import type {
  ICodeGenDescriptor,
  ICodeGenComponentMethod,
  IPropTransforms,
  ITagNameMapping,
  IRDependency,
  IRLiteral,
  IRPropValue,
  IModuleBuilder,
} from "@lowcode/schema";

// ---- ComponentCodeGenMeta —— Plugin 侧消费的函数式接口 ----
// (从旧 const/component-metadata.ts 迁移过来的接口定义)

export interface ComponentCodeGenMeta {
  getTagName: (props: Record<string, any>) => string;
  getTransformedProps: (
    props: Record<string, any>,
  ) => Record<string, IRPropValue>;
  getLogicFragments?: (
    props: Record<string, any>,
    moduleBuilder: IModuleBuilder,
  ) => void;
}

// ---- Parser 侧消费的元数据 ----

export interface IResolvedMetadata {
  componentName: string;
  dependency: IRDependency;
  isContainer: boolean;
  methods?: ICodeGenComponentMethod[];
}

// =========================================================================
// CodeGenRegistry
// =========================================================================

export class CodeGenRegistry {
  /** 声明式描述符 Map（name → descriptor） */
  private descriptors = new Map<string, ICodeGenDescriptor>();

  /** 程序式逃生舱 Map（name → 完整的函数式 meta） */
  private customLogic = new Map<string, ComponentCodeGenMeta>();

  // ---- 注册 API ----

  /**
   * 批量注册声明式描述符
   */
  registerDescriptors(descriptors: ICodeGenDescriptor[]): void {
    for (const d of descriptors) {
      this.descriptors.set(d.name, d);
    }
  }

  /**
   * 注册程序式逃生舱（完全覆盖声明式描述符的 resolve 结果）
   */
  registerCustomLogic(name: string, logic: ComponentCodeGenMeta): void {
    this.customLogic.set(name, logic);
  }

  // ---- 消费 API ----

  /**
   * 供 Plugin（jsx.ts / template.ts）调用
   * 返回一个 ComponentCodeGenMeta（函数式接口）
   *
   * 优先级：customLogic > descriptor > defaultMeta
   */
  resolve(componentName: string): ComponentCodeGenMeta {
    // 1. 逃生舱优先
    const custom = this.customLogic.get(componentName);
    if (custom) return custom;

    // 2. 声明式描述符 → 解释为函数
    const descriptor = this.descriptors.get(componentName);
    if (descriptor) return this.interpretDescriptor(descriptor);

    // 3. 都没有 → 默认逻辑
    return this.createDefaultMeta(componentName);
  }

  /**
   * 供 SchemaParser 调用
   * 返回 dependency / componentName / isContainer 等解析阶段需要的信息
   */
  getMetadata(componentName: string): IResolvedMetadata | undefined {
    const descriptor = this.descriptors.get(componentName);
    if (!descriptor) return undefined;

    return {
      componentName: this.resolveStaticTagName(descriptor) ?? componentName,
      dependency: descriptor.dependency,
      isContainer: descriptor.isContainer ?? false,
      methods: descriptor.methods,
    };
  }

  /**
   * 聚合所有已注册描述符的依赖信息（用于生成 package.json）
   */
  getAllDependencies(): Record<string, string> {
    const deps: Record<string, string> = {};

    for (const descriptor of this.descriptors.values()) {
      const dep = descriptor.dependency;
      // 只处理有 package 且有 version 的外部依赖
      if (dep.package && !dep.package.startsWith(".") && dep.version) {
        deps[dep.package] = dep.version;
      }

      // 处理 peerDependencies
      if (descriptor.peerDependencies) {
        for (const peer of descriptor.peerDependencies) {
          if (peer.package && peer.version) {
            deps[peer.package] = peer.version;
          }
        }
      }
    }

    return deps;
  }

  /**
   * 检查某个组件是否已注册
   */
  has(componentName: string): boolean {
    return (
      this.descriptors.has(componentName) || this.customLogic.has(componentName)
    );
  }

  // ---- 私有：声明式 → 函数式 解释器 ----

  /**
   * 将 ICodeGenDescriptor 解释为 ComponentCodeGenMeta
   */
  private interpretDescriptor(
    descriptor: ICodeGenDescriptor,
  ): ComponentCodeGenMeta {
    return {
      getTagName: this.buildGetTagName(descriptor),
      getTransformedProps: this.buildGetTransformedProps(descriptor),
      // 声明式描述符没有 getLogicFragments（那是逃生舱的事）
    };
  }

  /**
   * 根据 descriptor.tagName 构建 getTagName 函数
   */
  private buildGetTagName(
    descriptor: ICodeGenDescriptor,
  ): (props: Record<string, any>) => string {
    const { tagName, dependency, name } = descriptor;

    // 未指定 tagName → 使用 exportName 或 name
    if (tagName === undefined) {
      const staticName = dependency.exportName ?? name;
      // 处理子组件（如 List.Item）
      if (dependency.subName) {
        return () => `${staticName}.${dependency.subName}`;
      }
      return () => staticName;
    }

    // 静态字符串
    if (typeof tagName === "string") {
      return () => tagName;
    }

    // 动态映射
    const mapping: ITagNameMapping = tagName;
    return (props: Record<string, any>) => {
      const propValue = props[mapping.prop];
      // prop 可能是 IRLiteral 也可能是原始值
      const rawValue =
        typeof propValue === "object" &&
        propValue !== null &&
        "type" in propValue &&
        propValue.type === "Literal"
          ? propValue.value
          : propValue;

      return mapping.map[rawValue] ?? mapping.default;
    };
  }

  /**
   * 根据 descriptor.propTransforms 构建 getTransformedProps 函数
   */
  private buildGetTransformedProps(
    descriptor: ICodeGenDescriptor,
  ): (props: Record<string, any>) => Record<string, IRPropValue> {
    const transforms = descriptor.propTransforms;

    return (props: Record<string, any>) => {
      // 始终需要过滤的 Schema 内部字段
      const { desc, parentId, id, name, ...validProps } = props;

      // 应用声明式过滤规则
      const filtered = this.applyFilter(validProps, transforms);

      // 应用重命名规则
      const renamed = this.applyRename(filtered, transforms);

      // 转换为 IRPropValue 格式
      return this.toIRProps(renamed);
    };
  }

  /**
   * 过滤 props（移除 filter 列表 + tagNameProp）
   */
  private applyFilter(
    props: Record<string, any>,
    transforms?: IPropTransforms,
  ): Record<string, any> {
    if (!transforms) return { ...props };

    const result = { ...props };

    // 移除 filter 列表中的 prop
    if (transforms.filter) {
      for (const key of transforms.filter) {
        delete result[key];
      }
    }

    // 移除 tagNameProp（已用于决定标签名，不应透传）
    if (transforms.tagNameProp) {
      delete result[transforms.tagNameProp];
    }

    return result;
  }

  /**
   * 重命名 props
   */
  private applyRename(
    props: Record<string, any>,
    transforms?: IPropTransforms,
  ): Record<string, any> {
    if (!transforms?.rename) return props;

    const result = { ...props };
    for (const [from, to] of Object.entries(transforms.rename)) {
      if (from in result) {
        result[to] = result[from];
        delete result[from];
      }
    }
    return result;
  }

  /**
   * 将原始 props 转换为 IRPropValue 格式
   */
  private toIRProps(props: Record<string, any>): Record<string, IRPropValue> {
    const irProps: Record<string, IRPropValue> = {};

    for (const key in props) {
      const value = props[key];
      if (typeof value === "object" && value !== null && "type" in value) {
        // 已经是 IRPropValue
        irProps[key] = value;
      } else {
        // 包装为 Literal
        irProps[key] = { type: "Literal", value } as IRLiteral;
      }
    }

    return irProps;
  }

  /**
   * 从 descriptor 中提取静态标签名（仅用于 Parser 阶段的 componentName 映射）
   */
  private resolveStaticTagName(
    descriptor: ICodeGenDescriptor,
  ): string | undefined {
    const { tagName, dependency, name } = descriptor;

    // 检查是否有子组件名
    if (dependency.subName) {
      return `${dependency.exportName ?? name}.${dependency.subName}`;
    }

    if (tagName === undefined) {
      return dependency.exportName ?? name;
    }

    if (typeof tagName === "string") {
      return tagName;
    }

    // 动态映射 → 返回 exportName（Parser 不知道运行时 prop 值）
    return dependency.exportName ?? name;
  }

  /**
   * 创建默认的 ComponentCodeGenMeta（用于未注册的组件）
   */
  private createDefaultMeta(componentName: string): ComponentCodeGenMeta {
    return {
      getTagName: () => componentName,
      getTransformedProps: (props: Record<string, any>) => {
        const { desc, parentId, id, name, ...validProps } = props;
        return this.toIRProps(validProps);
      },
    };
  }
}
